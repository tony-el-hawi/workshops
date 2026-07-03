import boto3
import os
from boto3.dynamodb.conditions import Key

def lambda_handler(event, context):
    post_id = event.get("postId", "*")
    user = event.get("user", "")

    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(os.environ["DB_TABLE_NAME"])

    if post_id == "*":
        items = table.query(
            IndexName="user-index",
            KeyConditionExpression=Key("user").eq(user),
        )
    else:
        items = table.query(
            KeyConditionExpression=Key("id").eq(post_id),
        )

    return items["Items"]
