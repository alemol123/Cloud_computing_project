// ==== API CONFIG ====
// TODO: when you deploy your Azure Function App,
// replace THIS with your real URL, e.g.
// const API_BASE = "https://myfunctionapp.azurewebsites.net/api";
const API_BASE = "https://YOUR-FUNCTION-APP-NAME.azurewebsites.net/api";

const REGISTER_MEAL_URL = `${API_BASE}/HTTPRegisterMeal`;
const GET_MEALS_URL = `${API_BASE}/HTTPGetMealsByArea`;
const SUBMIT_ORDER_URL = `${API_BASE}/HTTPSubmitOrder`;

// ==== RESTAURANT: REGISTER MEAL ====

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
    messageEl.textContent = "Meal saved successfully! (ID: " + (data.mealId || "n/a") + ")";

    // clear form
    document.getElementById("mealForm").reset();
  } catch (err) {
    console.error(err);
    messageEl.textContent = "Network error when saving meal.";
  }
}

console.log("app.js loaded");
