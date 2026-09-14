import mongoose from "mongoose";

async function main() {
  const uri =
    process.env.MONGODB_URI ||
    "mongodb+srv://easinnextleaders_db_user:SXOqQezYCRdwSzVW@cluster0.qnhfjkl.mongodb.net/smspro_production?retryWrites=true&w=majority";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas");

  const db = mongoose.connection.db;
  if (!db) throw new Error("No database connection");

  // 1. Update ApiCredential collection for ALL organizations
  const credsUpdate = await db.collection("apicredentials").updateMany(
    {},
    {
      $set: {
        provider: "zendsms",
        name: "ZendSMS Primary Gateway",
        apiKey: "sk_agowwwg3j8x8u8o5opcwoyqgxii2zafmikbxtfxo",
        senderId: "8809612781020",
        apiUrl: "https://api.zendsms.com/api/v1/send-sms",
        balance: 4704,
        status: "active",
        isDefault: true,
        updatedAt: new Date(),
      },
    }
  );
  console.log("Updated apicredentials:", credsUpdate.modifiedCount);

  // If none exists, insert default one
  const count = await db.collection("apicredentials").countDocuments();
  if (count === 0) {
    const org = await db.collection("organizations").findOne({});
    const orgId = org?._id || new mongoose.Types.ObjectId("670000000000000000000001");
    await db.collection("apicredentials").insertOne({
      organizationId: orgId,
      provider: "zendsms",
      name: "ZendSMS Primary Gateway",
      apiKey: "sk_agowwwg3j8x8u8o5opcwoyqgxii2zafmikbxtfxo",
      senderId: "8809612781020",
      apiUrl: "https://api.zendsms.com/api/v1/send-sms",
      balance: 4704,
      status: "active",
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Inserted new ZendSMS credential");
  }

  // 2. Update Organizations defaultSenderId & senderIds
  const orgsUpdate = await db.collection("organizations").updateMany(
    {},
    {
      $set: {
        defaultSenderId: "8809612781020",
        senderIds: ["8809612781020", "MYBRAND", "SMSPRO"],
        updatedAt: new Date(),
      },
    }
  );
  console.log("Updated organizations:", orgsUpdate.modifiedCount);

  // 3. Update DeliveryJobs
  const jobsUpdate = await db.collection("deliveryjobs").updateMany(
    {},
    {
      $set: {
        provider: "zendsms",
      },
    }
  );
  console.log("Updated deliveryjobs:", jobsUpdate.modifiedCount);

  // 4. Update Campaigns senderId if old
  const campUpdate = await db.collection("campaigns").updateMany(
    { senderId: "8809648910379" },
    { $set: { senderId: "8809612781020" } }
  );
  console.log("Updated campaigns:", campUpdate.modifiedCount);

  const allCreds = await db.collection("apicredentials").find({}).toArray();
  console.log("All DB Credentials in MongoDB:", allCreds);

  await mongoose.disconnect();
  console.log("MongoDB sync completed successfully!");
}

main().catch(console.error);
