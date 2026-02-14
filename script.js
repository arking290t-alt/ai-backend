const STORAGE_KEY = "shop_items_v1";

const credentials = {
  admin: { password: "admin", role: "owner" },
  customer: { password: "customer", role: "customer" },
};

const loginView = document.getElementById("login-view");
const ownerView = document.getElementById("owner-view");
const customerView = document.getElementById("customer-view");

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");

const ownerForm = document.getElementById("owner-form");
const ownerMessage = document.getElementById("owner-message");
const ownerItems = document.getElementById("owner-items");

const customerItems = document.getElementById("customer-items");
const emptyMessage = document.getElementById("empty-message");
const searchInput = document.getElementById("search-input");

document.getElementById("owner-logout").addEventListener("click", () => switchView("login"));
document
  .getElementById("customer-logout")
  .addEventListener("click", () => switchView("login"));

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const id = document.getElementById("user-id").value.trim();
  const password = document.getElementById("password").value;

  const account = credentials[id];

  if (!account || account.password !== password) {
    setMessage(loginMessage, "Invalid ID or password.", true);
    return;
  }

  setMessage(loginMessage, "");
  loginForm.reset();
  switchView(account.role);
});

ownerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.getElementById("item-name").value.trim();
  const price = Number(document.getElementById("item-price").value);
  const description = document.getElementById("item-description").value.trim();
  const fileInput = document.getElementById("item-photo");
  const imageFile = fileInput.files[0];

  if (!name || !description || !Number.isFinite(price) || price < 0) {
    setMessage(ownerMessage, "Please add valid item details.", true);
    return;
  }

  if (!imageFile) {
    setMessage(ownerMessage, "Please choose an image for the item.", true);
    return;
  }

  const imageData = await fileToDataUrl(imageFile);
  const items = getItems();

  items.unshift({
    id: crypto.randomUUID(),
    name,
    price: price.toFixed(2),
    description,
    image: imageData,
  });

  saveItems(items);
  ownerForm.reset();
  setMessage(ownerMessage, "Item added successfully.");
  renderItems();
});

ownerItems.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.matches("[data-action='delete-item']")) {
    const itemId = target.dataset.itemId;
    if (!itemId) return;

    const updated = getItems().filter((item) => item.id !== itemId);
    saveItems(updated);
    renderItems();
    setMessage(ownerMessage, "Item removed from inventory.");
  }
});

searchInput.addEventListener("input", renderItems);

function switchView(view) {
  loginView.classList.remove("active");
  ownerView.classList.remove("active");
  customerView.classList.remove("active");

  if (view === "owner") {
    ownerView.classList.add("active");
    renderItems();
    return;
  }

  if (view === "customer") {
    customerView.classList.add("active");
    renderItems();
    return;
  }

  loginView.classList.add("active");
}

function getItems() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function renderItems() {
  const allItems = getItems();
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filteredItems = allItems.filter((item) => item.name.toLowerCase().includes(searchTerm));

  ownerItems.innerHTML =
    allItems
      .map((item) => productTemplate(item, true))
      .join("") || `<p class="empty-message">No items in inventory.</p>`;

  customerItems.innerHTML = filteredItems.map((item) => productTemplate(item, false)).join("");
  emptyMessage.style.display = filteredItems.length ? "none" : "block";
}

function productTemplate(item, isOwnerView = false) {
  const safeName = escapeHtml(item.name);
  const safeDescription = escapeHtml(item.description);

  return `
    <article class="product-card">
      <img src="${item.image}" alt="${safeName}" />
      <div class="content">
        <h4>${safeName}</h4>
        <p>${safeDescription}</p>
        <p class="price">$${item.price}</p>
        ${
          isOwnerView
            ? `<button class="btn btn-danger" data-action="delete-item" data-item-id="${item.id}">Delete</button>`
            : ""
        }
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setMessage(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle("error", isError);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

renderItems();
