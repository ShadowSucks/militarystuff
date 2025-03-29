// details.js
let allData = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadItemDetails();
  } catch (error) {
    console.error("Error loading details:", error);
    showError();
  }
});

function showError() {
  const container = document.querySelector(".container");
  if (container) {
    container.innerHTML = `
            <div class="error-message">
                <h1>Error Loading Item</h1>
                <p>Could not load the requested item details.</p>
                <a href="index.html" class="back-btn">
                    <i class="fas fa-arrow-left"></i> Back to List
                </a>
            </div>
        `;
  }
}

async function loadItemDetails() {
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get("id");

  if (!itemId) {
    showError();
    return;
  }

  try {
    const response = await fetch("data.json");
    allData = await response.json();
    const item = allData.find((i) => i.id.toString() === itemId);

    if (!item) {
      showError();
      return;
    }

    // Update page content
    document.getElementById("item-name").textContent = item.name;
    document.title = `${item.name} Details`;

    // Update description with links
    const description = item.description.replace(
      /([\w-]+);(\d+)/g,
      (match, word, number) => `<a href="details.html?id=${number}">${word}</a>`
    );
    document.getElementById("item-description").innerHTML = description;

    // Update details table
    const detailsTable = document.getElementById("item-details");
    if (detailsTable) {
      detailsTable.innerHTML = `
        <tr><th>Year Announced</th><td>${item.yearAnnounced ?? "N/A"}</td></tr>
        <tr><th>Year Abandoned</th><td>${item.yearAbandoned ?? "N/A"}</td></tr>
        <tr><th>In Service</th><td>${item.inService ?? "N/A"}</td></tr>
        <tr><th>Total Made</th><td>${item.totalMade ?? "N/A"}</td></tr>
    `;
    }

    const propertiesTable = document.getElementById("item-properties");
    if (propertiesTable) {
      propertiesTable.innerHTML = `
        <tr><th>Type</th><td>${item.type
          .split(",")
          .map(
            (type) =>
              `<a href="index.html?type=${type.trim()}">${type.trim()}</a>`
          )
          .join(", ")}</td></tr>
        <tr><th>Made By</th><td>${item.madeBy
          .split(",")
          .map(
            (e) =>
              `<a href="index.html?madeBy=${e.split("//")[0].trim()}">${e
                .split("//")[0]
                .trim()}</a>${e.split("//")[1] || ""}`
          )
          .join(", ")}</td></tr>
        <tr><th>Country</th><td>
            <a href="index.html?countryOfOrigin=${item.countryOfOrigin}">${
        item.countryOfOrigin
      }</a>
        </td></tr>
        <tr><th>Used By</th><td>${item.usedBy
          .split(",")
          .map(
            (used) =>
              `<a href="index.html?usedBy=${used.split("//")[0].trim()}">${used
                .split("//")[0]
                .trim()}</a>${used.split("//")[1] || ""}`
          )
          .join(", ")}</td></tr>
        ${item.properties
          .map(
            (prop) => `
            <tr><th>${prop.name}</th><td>
                ${
                  prop.value.split(";")[1]
                    ? `<a href="details.html?id=${prop.value.split(";")[1]}">${
                        prop.value.split(";")[0]
                      }</a>`
                    : prop.value.split(";")[0]
                }
            </td></tr>
        `
          )
          .join("")}
    `;
    }

    // Update images
    const picturesDiv = document.getElementById("item-pictures");
    if (picturesDiv) {
      picturesDiv.innerHTML = item.pictures
        .map(
          (pic) => `
                <div class="spicture">
                    <img src="${pic.url}" alt="${pic.title || item.name}">
                    ${pic.title ? `<p>${pic.title}</p>` : ""}
                </div>
            `
        )
        .join("");
    }

    // Update meta tags
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", item.description);
    }

    const ogDescription = document.querySelector(
      'meta[property="og:description"]'
    );
    if (ogDescription) {
      ogDescription.setAttribute("content", item.description);
    }

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && item.pictures[0]?.url) {
      ogImage.setAttribute(
        "content",
        `${location.origin}${item.pictures[0].url.substr(1)}`
      );
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", `${item.name} Details`);
    }

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) {
      ogUrl.setAttribute("content", document.location.href);
    }
  } catch (error) {
    console.error("Error loading item details:", error);
    showError();
  }
}
