import logging
import azure.functions as func
from azure.data.tables import TableServiceClient
import os
import json

# Use the AzureWebJobsStorage connection string
connection_string = os.environ["AzureWebJobsStorage"]
service = TableServiceClient.from_connection_string(connection_string)
meals_table = service.get_table_client("Meals")


def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('get_meals_by_area function processed a request.')

    area = req.params.get('area')
    if not area:
        try:
            body = req.get_json()
            area = body.get("area")
        except ValueError:
            area = None

    if not area:
        return func.HttpResponse(
            json.dumps({"error": "Missing 'area' parameter"}),
            status_code=400,
            mimetype="application/json"
        )

    meals = []
    # Filter by PartitionKey (area)
    filter_expr = f"PartitionKey eq '{area}'"

    try:
        for entity in meals_table.list_entities(filter=filter_expr):
            meals.append({
                "id": entity["RowKey"],
                "restaurantName": entity.get("restaurantName"),
                "name": entity.get("name"),
                "description": entity.get("description"),
                "prepMinutes": entity.get("prepMinutes"),
                "price": entity.get("price")
            })
    except Exception as e:
        logging.error(f"Error querying Meals table: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Server error reading meals"}),
            status_code=500,
            mimetype="application/json"
        )

    return func.HttpResponse(
        json.dumps(meals),
        status_code=200,
        mimetype="application/json"
    )
