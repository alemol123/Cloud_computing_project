import azure.functions as func

def main(req: func.HttpRequest) -> func.HttpResponse:
    # TODO: add code to save meal to Azure Table
    return func.HttpResponse(
        "HTTPRegisterMeal function placeholder",
        status_code=200
    )
