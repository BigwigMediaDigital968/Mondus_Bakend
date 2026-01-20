const express = require("express");
const axios = require("axios");
const xml2js = require("xml2js");
const router = express.Router();

const XML_URL = "https://connecteo.in/mondus-property-listing/website-xml.php";

// Utility function to fetch and parse data
async function getProperties() {
  const response = await axios.get(XML_URL);
  const xml = response.data;

  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
      if (err) return reject(err);
      resolve(result.list.property || []);
    });
  });
}

// Route: All properties
router.get("/", async (req, res) => {
  try {
    const properties = await getProperties();
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// Route: Rent properties
router.get("/rent", async (req, res) => {
  try {
    const properties = await getProperties();
    const rentData = properties.filter(
      (item) =>
        item?.properties.property_purpose.key_0 === "Rent" ||
        item?.name?.toLowerCase().includes("Rent"),
    );
    res.json(rentData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rent properties" });
  }
});

// Route: Sale properties
router.get("/sale", async (req, res) => {
  try {
    const properties = await getProperties();
    const saleData = properties.filter(
      (item) =>
        item?.properties.property_purpose.key_0 === "Sale" ||
        item?.name?.toLowerCase().includes("Sale"),
    );
    res.json(saleData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sale properties" });
  }
});

module.exports = router;
