// ==== API CONFIG ====
// TODO: when you deploy your Azure Function App,
// replace THIS with your real URL, e.g.
// const API_BASE = "https://myfunctionapp.azurewebsites.net/api";
const API_BASE = "https://YOUR-FUNCTION-APP-NAME.azurewebsites.net/api";

const REGISTER_MEAL_URL = `${API_BASE}/HTTPRegisterMeal`;
const GET_MEALS_URL = `${API_BASE}/HTTPGetMealsByArea`;
const SUBMIT_ORDER_URL = `${API_BASE}/HTTPSubmitOrder`;

// We'll store the latest meals we loaded here
let currentMeals = [];

// ========================
// RESTAURANT: REGISTER MEAL
// ========================

async function registerMeal(event) {
  event.preventDefault(); // stop form from refreshing page

  const restaurantName = document.getElementById("restaurantName").value;
  const dishName = document.getElementById("dishName").value;
  const description = document.getElementById("description").value;
  const prepTime = document.getElementById("prepTime").value;
  const price = document.getElementById("price").value;
  const area = document.getElementById("area").value;

  const messageEl = document.getElementById("restaurantMessage");
  messageEl.textContent = "Saving meal...";

  const body = {
    restaurantName,
    dishName,
    description,
    prepTimeMinutes: prepTime,
    price: price,
    area,
  };

  try {
    const response = await fetch(REGISTER_MEAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      messageEl.textContent = "Error: " + errorText;
      return;
    }

    const data = await response.json().catch(() => ({}));
    messageEl.textContent =
      "Meal saved successfully! (ID: " + (data.mealId || "n/a") + ")";

    // clear form
    document.getElementById("mealForm").reset();
  } catch (err) {
    console.error(err);
    messageEl.textContent = "Network error when saving meal.";
  }
}

// ========================
// CUSTOMER: LOAD MEALS
// ========================

async function loadMeals() {
  const area = document.getElementById("customerArea").value;
  const msg = document.getElementById("loadMealsMessage");
  const tbody = document.getElementById("mealsBody");

  if (!area) {
    msg.textContent = "Please choose an area first.";
    return;
  }

  msg.textContent = "Loading meals...";
  tbody.innerHTML = "";
  currentMeals = [];

  try {
    const url = `${GET_MEALS_URL}?area=${encodeURIComponent(area)}`;
    const response = await fetch(url);

    if (!response.ok) {
      const txt = await response.text();
      msg.textContent = "Error: " + txt;
      return;
    }

    const meals = await response.json();
    if (!Array.isArray(meals) || meals.length === 0) {
      msg.textContent = "No meals found for this area yet.";
      return;
    }

    currentMeals = meals;

    // build table rows
    meals.forEach((m, index) => {
      const tr = document.createElement("tr");

      const restaurant = m.RestaurantName || m.restaurantName || "";
      const dish = m.DishName || m.dishName || "";
      const desc = m.Description || m.description || "";
      const prep = m.PrepTimeMinutes || m.prepTimeMinutes || "";
      const price = m.Price || m.price || "";

      tr.innerHTML = `
        <td>${restaurant}</td>
        <td>${dish}</td>
        <td>${desc}</td>
        <td>${prep}</td>
        <td>${price}</td>
        <td>
          <input type="number"
                 min="0"
                 value="0"
                 class="mealQty"
                 data-index="${index}" />
        </td>
      `;
      tbody.appendChild(tr);
    });

    msg.textContent = "Meals loaded. Set quantities and place order.";
  } catch (err) {
    console.error(err);
    msg.textContent = "Network error loading meals.";
  }
}

// ========================
// CUSTOMER: SUBMIT ORDER
// ========================

async function submitOrder() {
  const area = document.getElementById("customerArea").value;
  const name = document.getElementById("customerName").value;
  const address = document.getElementById("customerAddress").value;
  const messageEl = document.getElementById("orderMessage");

  if (!area) {
    messageEl.textContent = "Please choose a delivery area first.";
    return;
  }

  const qtyInputs = document.querySelectorAll(".mealQty");
  const items = [];

  qtyInputs.forEach((input) => {
    const qty = parseInt(input.value, 10) || 0;
    if (qty > 0) {
      const index = parseInt(input.getAttribute("data-index"), 10);
      const meal = currentMeals[index];
      if (meal) {
        items.push({
          mealId: meal.RowKey || meal.rowKey || "",
          name: meal.DishName || meal.dishName || "",
          price: meal.Price || meal.price || 0,
          prepTimeMinutes: meal.PrepTimeMinutes || meal.prepTimeMinutes || 0,
          quantity: qty,
        });
      }
    }
  });

  if (items.length === 0) {
    messageEl.textContent = "Please select at least one meal.";
    return;
  }

  const body = {
    area,
    customerName: name,
    address,
    items,
  };

  messageEl.textContent = "Submitting order...";

  try {
    const response = await fetch(SUBMIT_ORDER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const txt = await response.text();
      messageEl.textContent = "Error: " + txt;
      return;
    }

    const data = await response.json().catch(() => ({}));
    const total = data.totalPrice ?? "unknown";
    const eta = data.estimatedMinutes ?? "unknown";

    messageEl.textContent =
      `Order placed! Total: ${total}. Estimated delivery time: ${eta} minutes.`;
  } catch (err) {
    console.error(err);
    messageEl.textContent = "Network error submitting order.";
  }
}

console.log("app.js loaded");
