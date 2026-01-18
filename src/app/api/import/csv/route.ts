import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from ".prisma/client/edge";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const storeId = formData.get("storeId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!storeId) {
      return NextResponse.json({ error: "No store selected" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.trim().split("\n");

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV must have headers and at least one data row" },
        { status: 400 },
      );
    }

    // Parse CSV
    const headers = parseCSVLine(lines[0]);
    const data = lines.slice(1).map((line) => {
      const values = parseCSVLine(line);
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header.toLowerCase().trim()] = values[index]?.trim() || "";
      });
      return row;
    });

    // Import based on content
    const results = await importData(data, parseInt(storeId));

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Error importing CSV:", error);
    return NextResponse.json(
      { error: "Failed to import CSV: " + (error as Error).message },
      { status: 500 },
    );
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

async function importData(
  rows: Record<string, string>[],
  storeId: number,
): Promise<{
  success: number;
  failed: number;
  errors: { row: number; error?: string }[];
  type: string;
}> {
  const errors: { row: number; error?: string }[] = [];
  let success = 0;
  let failed = 0;

  // Detect type based on column names
  const firstRow = rows[0];
  const columns = Object.keys(firstRow).map((col) => col.toLowerCase());
  let importType = "unknown";

  // Check for sales first (has "total order price")
  if (columns.some((c) => c.includes("total order price"))) {
    importType = "sales";
  } else if (columns.some((c) => c.toLowerCase().includes("date received"))) {
    importType = "inventory";
  } else if (columns.some((c) => c.toLowerCase().includes("show in store"))) {
    importType = "products";
  } else if (
    columns.some(
      (c) =>
        c.includes("customer") || c.includes("email") || c.includes("contact"),
    )
  ) {
    importType = "customers";
  } else if (
    columns.some(
      (c) =>
        c.includes("source") || c.includes("supplier") || c.includes("vendor"),
    )
  ) {
    importType = "sources";
  }

  console.log("Detected import type:", importType);

  // Import based on type
  if (importType === "sales") {
    // Group rows by order ID
    const orderMap = new Map<string, Record<string, string>[]>();
    for (const row of rows) {
      const orderId = row["orders2"] || "unknown";
      if (!orderMap.has(orderId)) {
        orderMap.set(orderId, []);
      }
      orderMap.get(orderId)!.push(row);
    }

    // Process each order
    let rowIndex = 2;
    for (const [orderId, orderRows] of orderMap) {
      try {
        const result = await importSaleOrder(orderId, orderRows, rowIndex);
        if (result.success) {
          success += orderRows.length;
        } else {
          failed += orderRows.length;
          errors.push({ row: rowIndex, error: result.error });
        }
      } catch (error) {
        failed += orderRows.length;
        errors.push({ row: rowIndex, error: (error as Error).message });
      }
      rowIndex += orderRows.length;
    }
  } else if (importType === "inventory") {
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const result = await importInventory(row, storeId);
        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push({ row: i + 2, error: result.error });
        }
      } catch (error) {
        failed++;
        errors.push({ row: i + 2, error: (error as Error).message });
      }
    }
  } else if (importType === "products") {
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const result = await importProduct(row, storeId);
        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push({ row: i + 2, error: result.error });
        }
      } catch (error) {
        failed++;
        errors.push({ row: i + 2, error: (error as Error).message });
      }
    }
  } else if (importType === "customers") {
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const result = await importCustomer(row, storeId);
        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push({ row: i + 2, error: result.error });
        }
      } catch (error) {
        failed++;
        errors.push({ row: i + 2, error: (error as Error).message });
      }
    }
  } else if (importType === "sources") {
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const result = await importSource(row);
        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push({ row: i + 2, error: result.error });
        }
      } catch (error) {
        failed++;
        errors.push({ row: i + 2, error: (error as Error).message });
      }
    }
  }

  return { success, failed, errors, type: importType };
}

async function importSaleOrder(
  orderId: string,
  orderRows: Record<string, string>[],
  startRowIndex: number = 2,
): Promise<{ success: boolean; error?: string }> {
  if (orderRows.length === 0) {
    return { success: false, error: "No rows provided for order" };
  }

  // All rows in an order should have the same customer name and total order price
  const firstRow = orderRows[0];
  const customerEmail = firstRow["customer (from orders2)"];
  let totalOrderPrice = 0;

  try {
    // Find customer by email (case-insensitive)
    let customer = await prisma.customer.findFirst({
      where: {
        email: {
          equals: customerEmail.toLowerCase(),
        },
      },
    });

    // If customer not found, create an Unaccounted customer
    if (!customer) {
      customer = await prisma.customer.upsert({
        where: { email: customerEmail ?? "unaccounted@example.com" },
        update: {},
        create: {
          name: "Unaccounted",
          email: customerEmail ?? "unaccounted@example.com",
        },
      });
    }

    if (!customer) {
      return { success: false, error: "Customer email is required" };
    }
    const saleDate = firstRow["date (from orders2)"];

    // Process all items in this order
    const saleItems: {
      productId: number;
      quantity: number;
      costPrice: number;
      salePrice: number;
    }[] = [];

    const errors: Array<{ row: number; error?: string }> = [];

    for (let i = 0; i < orderRows.length; i++) {
      const row = orderRows[i];
      const rowNum = startRowIndex + i;
      const productName = row["product"];
      const quantity = parseFloat(row["quantity"] || "0");
      const totalSaleItemPrice = parseFloat(
        (row["total order price"] || "0").replace(/[^0-9.-]+/g, ""),
      );

      totalOrderPrice += totalSaleItemPrice;

      if (!productName) {
        errors.push({
          row: rowNum,
          error: `Product name is required ${JSON.stringify(row)}`,
        });
        continue;
      }

      if (isNaN(quantity) || quantity <= 0) {
        errors.push({
          row: rowNum,
          error: "Quantity must be a valid positive number",
        });
        continue;
      }

      // Find product by name (normalized)
      const allProducts = await prisma.product.findMany();
      const normalizedProductName = productName
        .toLowerCase()
        .replace(/"/g, "")
        .trim();
      const product = allProducts.find(
        (p) =>
          p.name.toLowerCase().replace(/"/g, "").trim() ===
          normalizedProductName,
      );

      if (!product) {
        errors.push({
          row: rowNum,
          error: `Product "${productName}" not found`,
        });
        continue;
      }

      saleItems.push({
        productId: product.id,
        quantity: Math.floor(quantity),
        costPrice:
          quantity > 0 ? totalSaleItemPrice / quantity : totalSaleItemPrice,
        salePrice:
          quantity > 0
            ? (totalSaleItemPrice / quantity) * 1.05
            : totalSaleItemPrice * 1.05,
      });
    }

    if (errors.length > 0) {
      console.error("There were errors with some imports:", errors);
    }

    const date = saleDate ? new Date(saleDate) : new Date();

    // Create sale with all items
    await prisma.sale.create({
      data: {
        customerId: customer.id,
        saleDate: !isNaN(date.getTime()) ? date : new Date(),
        totalCost: totalOrderPrice,
        markupPercent: 0.05,
        totalPrice: totalOrderPrice * 1.05,
        items: {
          create: saleItems,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error importing sale order:", error);
    return { success: false, error: (error as Error).message };
  }
}

async function importProduct(
  row: Record<string, string>,
  storeId: number,
): Promise<{ success: boolean; error?: string }> {
  const name = row["product"] || row["product name"] || row["name"];
  const source = row["source"] || row["source name"];
  const categoryNames = row["category"];
  const unitOfMeasurement = row["unit"] || row["uom"] || "units";
  const pricePerUnit = parseFloat(
    (row["price per unit"] || row["price"] || "0").replace(/[^0-9.-]+/g, ""),
  );
  const minimumStock = parseInt(
    row["minimum to stock"] || row["minimum stock"] || row["min stock"] || "0",
  );
  const isOrganic =
    (row["is organic"] || row["organic"] || "false").toLowerCase() ===
      "checked" || categoryNames.toLowerCase().includes("organic");
  const showInStorefront = row["show in store"].toLowerCase() === "checked";

  if (!name) {
    return { success: false, error: "Product name is required" };
  }

  if (isNaN(pricePerUnit) || pricePerUnit < 0) {
    return { success: false, error: "Invalid price per unit" };
  }

  if (isNaN(minimumStock) || minimumStock < 0) {
    return { success: false, error: "Invalid minimum stock" };
  }

  try {
    // Check if product already exists by name (case-insensitive)
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: {
          equals: name,
        },
        storeId,
      },
    });

    if (existingProduct) {
      return { success: false, error: `Product "${name}" already exists` };
    }

    // Find or create source if provided
    let sourceId: number | undefined;
    if (source && source.trim()) {
      let sourceRecord = await prisma.source.findUnique({
        where: { name: source },
      });

      if (!sourceRecord) {
        sourceRecord = await prisma.source.create({
          data: { name: source },
        });
      }
      sourceId = sourceRecord.id;
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) {
      return { success: false, error: `Store with ID ${storeId} not found` };
    }

    // Create product
    const productData: Prisma.ProductCreateInput = {
      name,
      sku:
        name
          .replace(/[^a-zA-Z0-9]/g, "-")
          .toUpperCase()
          .substring(0, 8) +
        "-" +
        Math.random().toString(36).substring(2, 6).toUpperCase(),
      unitOfMeasurement,
      pricePerUnit,
      minimumStock,
      isOrganic,
      store: { connect: { id: store.id } },
      showInStorefront,
      source: {
        connect: sourceId ? { id: sourceId } : undefined,
      },
    };

    // Handle categories if provided
    if (categoryNames && categoryNames.trim()) {
      const categoryList = categoryNames
        .split(";")
        .map((cat) => cat.trim())
        .filter((cat) => cat.length > 0);

      if (categoryList.length > 0) {
        // Fetch existing categories and create missing ones
        const existingCategories = await prisma.category.findMany({
          where: {
            name: {
              in: categoryList,
            },
          },
        });

        const existingNames = existingCategories.map((c) => c.name);
        const missingNames = categoryList.filter(
          (n) => !existingNames.includes(n),
        );

        // Create missing categories
        for (const catName of missingNames) {
          await prisma.category.create({
            data: { name: catName },
          });
        }

        // Get all categories
        const allCategories = await prisma.category.findMany({
          where: {
            name: {
              in: categoryList,
            },
          },
        });

        productData.categories = {
          create: allCategories.map((cat) => ({
            categoryId: cat.id,
          })),
        };
      }
    }

    await prisma.product.create({
      data: productData,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

async function importCustomer(
  row: Record<string, string>,
  storeId: number,
): Promise<{ success: boolean; error?: string }> {
  const name =
    row["name and surname"] ||
    row["customer name"] ||
    row["name"] ||
    row["customer"];
  const email = row["email"] || row["e-mail"];

  if (!name) {
    return { success: false, error: "Customer name is required" };
  }

  if (!email) {
    return { success: false, error: "Email is required" };
  }

  // Simple email validation
  if (!email.includes("@")) {
    return { success: false, error: "Invalid email format" };
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
      },
    });

    // Add customer to the store
    await prisma.customerStore.create({
      data: {
        customerId: customer.id,
        storeId,
      },
    });

    return { success: true };
  } catch (error) {
    const errorCode = (error as unknown as { code?: string })?.code;
    if (errorCode === "P2002") {
      return { success: false, error: `Email already exists: ${email}` };
    }
    return { success: false, error: (error as Error).message };
  }
}

async function importSource(
  row: Record<string, string>,
): Promise<{ success: boolean; error?: string }> {
  const name =
    row["source name"] || row["name"] || row["source"] || row["supplier"];

  if (!name) {
    return { success: false, error: "Source name is required" };
  }

  try {
    await prisma.source.create({
      data: {
        name,
      },
    });

    return { success: true };
  } catch (error) {
    const errorCode = (error as unknown as { code?: string })?.code;
    if (errorCode === "P2002") {
      return { success: false, error: `Source already exists: ${name}` };
    }
    return { success: false, error: (error as Error).message };
  }
}

async function importInventory(
  row: Record<string, string>,
  storeId: number,
): Promise<{ success: boolean; error?: string }> {
  const productName =
    row["product"] || row["product name"] || row["name"] || row["item"];
  const quantity = parseFloat(
    row["quantity"] ||
      row["quantity received"] ||
      row["qty"] ||
      row["amount"] ||
      "0",
  );
  const dateReceived =
    row["date received"] ||
    row["received date"] ||
    row["date"] ||
    new Date().toISOString().split("T")[0];
  const receiptUrl =
    row["receipt"] ||
    row["receipt url"] ||
    row["receipt info"] ||
    row["receipt number"] ||
    null;

  if (!productName) {
    return { success: false, error: "Product name is required" };
  }

  if (isNaN(quantity) || quantity <= 0) {
    return {
      success: false,
      error: "Quantity must be a valid positive number",
    };
  }

  try {
    // Find product by name (case-insensitive search, ignoring quotes and whitespace)
    // Only search in products from the specified store
    const allProducts = await prisma.product.findMany({
      where: { storeId },
    });
    const normalizedInputName = productName
      .toLowerCase()
      .replace(/"/g, "")
      .trim();
    const product = allProducts.find(
      (p) =>
        p.name.toLowerCase().replace(/"/g, "").trim() === normalizedInputName,
    );

    if (!product) {
      return {
        success: false,
        error: `Product "${productName}" not found in this store`,
      };
    }

    // Create inventory received record
    await prisma.inventoryReceived.create({
      data: {
        productId: product.id,
        quantity: Math.floor(quantity),
        receivedDate: new Date(dateReceived),
        receiptUrl: receiptUrl || undefined,
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
