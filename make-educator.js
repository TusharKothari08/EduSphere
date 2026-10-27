

const mongoose = require("./server/node_modules/mongoose");
const User = require("./server/src/models/User");


async function main() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/edemy_lms");

    const result = await User.updateOne(
      { clerkId: "user_3L59dwHQ7gznHIYxaAzd4SFxaHC" },
      { $set: { role: "educator" } }
    );

    console.log("Matched:", result.matchedCount);
    console.log("Updated:", result.modifiedCount);

    const user = await User.findOne({
      clerkId: "user_3L59dwHQ7gznHIYxaAzd4SFxaHC"
    }).select("name email role");

    console.log("Account:", user);
  } catch (error) {
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
  }
}

main();
