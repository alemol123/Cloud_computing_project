import azure.functions as func

def main(req: func.HttpRequest) -> func.HttpResponse:
    # TODO: add code to save order to Azure Table
    return func.HttpResponse(
        "HTTPSubmitOrder function placeholder",
        status_code=200
    )
