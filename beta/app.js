let allData = [];
let filteredData = [];
let currentSearchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded");
    if (document.getElementById('data-grid') && document.getElementById('current-category')) {
        initializePage();
    } else {
        console.error("Missing required DOM elements");
        showError("Page initialization failed. Missing required elements.");
    }
});
async function initializePage() {
    try {
        await loadData();
        setupEventListeners();
    } catch (error) {
        console.error("Initialization error:", error);
        showError("Failed to initialize. Please refresh the page.");
    }
}
async function loadData() {
    console.log("Starting data load..."); // Debug line
    try {
        const response = await fetch("data.json");
        console.log("Response status:", response.status); // Debug line
        if (!response.ok) throw new Error("Network response was not ok");
        
        allData = await response.json();
        console.log("Data loaded, item count:", allData.length); // Debug line
        applyInitialFilters();
        generateFilters();
        safeDisplayItems(filteredData);
    } catch (error) {
        console.error("Error loading data:", error);
        showError("Failed to load data. Please try again later.");
    }
}

function showError(message) {
    const errorContainer = document.getElementById("error-container") || createErrorContainer();
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
}

function createErrorContainer() {
    const container = document.createElement("div");
    container.id = "error-container";
    container.className = "error-message";
    document.querySelector(".container").prepend(container);
    return container;
}
function applyInitialFilters() {
    filteredData = [...allData];
    const params = new URLSearchParams(window.location.search);
    
    // Apply search first
    currentSearchQuery = params.get('search') || '';
    if (currentSearchQuery) {
        document.getElementById('search').value = currentSearchQuery;
        filteredData = filteredData.filter(item => 
            item.name.toLowerCase().includes(currentSearchQuery.toLowerCase())
        );
    }

    // Then apply other filters
    ['type', 'madeBy', 'countryOfOrigin', 'usedBy'].forEach(attr => {
        const value = params.get(attr);
        if (value) {
            filteredData = filteredData.filter(item => {
                if (attr === 'type') {
                    return item.type.split(",").some(type => type.trim() === value);
                }
                return item[attr].split(",").some(val => val.split("//")[0].trim() === value);
            });
        }
    });

    safeDisplayItems(filteredData);
}

function updateResultsInfo(count) {
    const params = new URLSearchParams(window.location.search);
    const activeFilters = Array.from(params.entries()).filter(([key]) => !['search'].includes(key)).length;
    
    const categoryElement = document.getElementById("current-category");
    if (categoryElement) {
        categoryElement.innerHTML = activeFilters > 0
            ? `Showing ${count} matching item${count !== 1 ? 's' : ''}`
            : `Showing all items (${count})`;
    }
}
function safeDisplayItems(data) {
    try {
        const grid = document.getElementById("data-grid");
        const categoryElement = document.getElementById("current-category");
        
        if (!grid || !categoryElement) {
            throw new Error("Required display elements not found");
        }

        grid.innerHTML = data.length > 0 ? "" : `<div class="no-results">No matching items found</div>`;
        
        data.forEach(item => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = createCardHTML(item);
            grid.appendChild(card);
        });

        updateResultsInfo(data.length);
    } catch (error) {
        console.error("Display error:", error);
        showError("Error displaying results.");
    }
}

function createCardHTML(item) {
    return `
        <div class="card-image">
            <img src="${item.pictures[0]?.url || 'placeholder.jpg'}" alt="${item.name}" loading="lazy">
        </div>
        <div class="card-content">
            <h3 class="card-title">${item.name}</h3>
            <div class="card-meta">
                <span class="meta-item">
                    <i class="fas fa-calendar-alt"></i>
                    ${item.yearAnnounced || 'N/A'}
                </span>
                <div class="type-tags">
                    ${item.type.split(',').map(type => `
                        <span class="type-tag" data-type="${type.trim()}">
                            ${type.trim()}
                        </span>
                    `).join('')}
                </div>
            </div>
            <div class="card-footer">
                <a href="details.html?id=${item.id}" class="details-btn">
                    View Details <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `;
}
function setupEventListeners() {
    // Search input with debounce
    const searchInput = document.getElementById('search');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.trim();
        updateUrlParameter('search', currentSearchQuery);
        
        // Clear previous timeout if it exists
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Set new timeout
        this.searchTimeout = setTimeout(() => {
            applySearch(currentSearchQuery);
        }, 300);
    });

    // Reset filters button
    document.getElementById('reset-filters').addEventListener('click', resetFilters);

    // Type tag click handlers (delegated)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('type-tag')) {
            const type = e.target.dataset.type;
            updateUrlParameter('type', type);
            applyFilter('type', type);
        }
    });

    // Filter select changes
    document.querySelectorAll('.filter-select').forEach(select => {
        select.addEventListener('change', (e) => {
            applyFilter(e.target.id, e.target.value);
        });
    });
}

function applySearch(query) {
    // Reset to all data when search is empty
    if (!query) {
        filteredData = [...allData];
    } else {
        filteredData = allData.filter(item => 
            item.name.toLowerCase().includes(query.toLowerCase())
        );
    }

    // Apply any active filters
    const params = new URLSearchParams(window.location.search);
    ['type', 'madeBy', 'countryOfOrigin', 'usedBy'].forEach(attr => {
        const value = params.get(attr);
        if (value) {
            filteredData = filteredData.filter(item => {
                if (attr === 'type') {
                    return item.type.split(",").some(type => type.trim() === value);
                }
                return item[attr].split(",").some(val => val.split("//")[0].trim() === value);
            });
        }
    });

    safeDisplayItems(filteredData);
}


function applyFilter(attribute, value) {
    const params = new URLSearchParams(window.location.search);
    
    if (!value || value === "") {
        params.delete(attribute);
    } else {
        params.set(attribute, value);
    }

    // Preserve existing filters and search
    if (currentSearchQuery) {
        params.set('search', currentSearchQuery);
    }

    window.location.search = params.toString();
}
function resetFilters() {
    // Clear all filters and search
    window.location.search = '';
    
    // Additional immediate UI reset for better responsiveness
    document.getElementById('search').value = '';
    currentSearchQuery = '';
    
    // Reset filter dropdowns
    document.querySelectorAll('.filter-select').forEach(select => {
        select.value = '';
    });
    
    // Reset display to show all items
    filteredData = [...allData];
    safeDisplayItems(filteredData);
}
function updateUrlParameter(key, value) {
    const params = new URLSearchParams(window.location.search);
    
    if (!value || value === "") {
        params.delete(key);
    } else {
        params.set(key, value);
    }

    // Don't trigger page reload for search
    if (key === 'search') {
        history.replaceState({}, '', `?${params.toString()}`);
    }
}

function generateFilters() {
    const filtersDiv = document.getElementById("filters");
    filtersDiv.innerHTML = "";

    const attributes = ["type", "countryOfOrigin", "madeBy", "usedBy"];
    attributes.forEach(attr => {
        const uniqueValues = [...new Set(allData.flatMap(item => {
            if (["usedBy", "madeBy", "type"].includes(attr)) {
                return item[attr].split(",").map(i => i.split("//")[0].trim());
            }
            return [item[attr].split("//")[0].trim()];
        }))].filter(Boolean);

        const filterGroup = document.createElement("div");
        filterGroup.className = "filter-group";
        filterGroup.innerHTML = `
            <label for="${attr}">${capitalize(attr.replace(/([A-Z])/g, " $1"))}:</label>
            <select id="${attr}" class="filter-select">
                <option value="">All</option>
                ${uniqueValues.map(value => `
                    <option value="${value}" ${new URLSearchParams(window.location.search).get(attr) === value ? 'selected' : ''}>
                        ${value}
                    </option>
                `).join("")}
            </select>
        `;
        filtersDiv.appendChild(filterGroup);
    });
}

function updateCategoryDisplay(text) {
    const element = document.getElementById("current-category");
    if (element) {
        element.textContent = text;
    }
}

function capitalize(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}