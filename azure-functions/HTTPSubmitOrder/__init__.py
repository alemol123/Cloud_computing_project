import logging
import azure.functions as func
from azure.data.tables import TableServiceClient
from uuid import uuid4
import os
import json
from datetime import datetime

connection_string = os.environ["AzureWebJobsStorage"]
service = TableServiceClient.from_connection_string(connection_string)
meals_table = service.get_table_client("Meals")
orders_table = service.get_table_client("Orders")


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('submit_order function processed a request.')

    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"error": "Invalid JSON body"}),
            status_code=400,
            mimetype="application/json"
        )

    area = body.get("area")
    address = body.get("address")
    items = body.get("items")  # list of {mealId, qty}

    # Basic validation
    if not area or not address or not items or not isinstance(items, list):
        return func.HttpResponse(
            json.dumps({"error": "Missing or invalid fields: area, address, items[]"}),
            status_code=400,
            mimetype="application/json"
        )

    total_cost = 0
    total_prep = 0

    # Look up each meal in Meals table to compute totals
    try:
        for item in items:
            meal_id = item.get("mealId")
            qty = int(item.get("qty", 1))

            if not meal_id or qty <= 0:
                continue

            # PartitionKey = area, RowKey = mealId
            entity = meals_table.get_entity(partition_key=area, row_key=meal_id)

            price = float(entity.get("price", 0))
            prep = int(entity.get("prepMinutes", 0))

            total_cost += price * qty
            total_prep += prep * qty
    except Exception as e:
        logging.error(f"Error calculating order totals: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Error processing order items"}),
            status_code=500,
            mimetype="application/json"
        )

    # Simple estimate formula
    PICKUP_TIME = 10
    DELIVERY_TIME = 15
    est_delivery_minutes = total_prep + PICKUP_TIME + DELIVERY_TIME

    order_id = str(uuid4())

    # Ensure Orders table exists (in case)
    try:
        service.create_table("Orders")
    except:
        pass

    # Store order
    try:
        orders_table.create_entity({
            "PartitionKey": area,
            "RowKey": order_id,
            "items": json.dumps(items),
            "totalCost": total_cost,
            "estDeliveryMinutes": est_delivery_minutes,
            "customerAddress": address,
            "createdAt": datetime.utcnow().isoformat()
        })
    except Exception as e:
        logging.error(f"Error saving order: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Error saving order"}),
            status_code=500,
            mimetype="application/json"
        )

    response_body = {
        "orderId": order_id,
        "totalCost": total_cost,
        "estDeliveryMinutes": est_delivery_minutes
    }

    return func.HttpResponse(
        json.dumps(response_body),
        status_code=200,
        mimetype="application/json"
    )
