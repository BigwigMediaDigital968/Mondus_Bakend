const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connect } = require("./config/db");
const subscriberRoutes = require("./routes/subscriber.routes");
// const promptRoute = require("./routes/promptConsultation");
const propertList = require("./routes/property.routes");
const BlogRoute = require("./routes/blog.routes");
const path = require("path");
const listingRoutes = require("./routes/listing.route");
const opportunityRoutes = require("./routes/opportunity.route");
const notifyRoutes = require("./routes/notifyRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const developerRoutes = require("./routes/developerRoutes.js");
const app = express();

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/", subscriberRoutes);
// app.use("/api", promptRoute);
app.use("/api/properties", propertList);
app.use("/api/blogs", BlogRoute);
app.use("/api/listing", listingRoutes);
app.use("/api/opportunity", opportunityRoutes);
app.use("/api/notify", notifyRoutes);
app.use("/api/property", propertyRoutes);
app.use("/api/developers", developerRoutes);

app.listen(process.env.PORT, async () => {
  try {
    await connect();
  } catch (error) {
    console.error("❌ DB connection failed:", error);
  }

  console.log(`🚀 Server is listening on port ${process.env.PORT}`);
});

require("./newsletterScheduler");
