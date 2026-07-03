import boto3
import os
import uuid

def lambda_handler(event, context):
    record_id = str(uuid.uuid4())
    voice = event["voice"]
    text = event["text"]
    user = event["user"]

    # Écriture dans DynamoDB
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(os.environ["DB_TABLE_NAME"])
    table.put_item(
        Item={
            "id": record_id,
            "voice": voice,
            "text": text,
            "user": user,
            "status": "PROCESSING",
        }
    )

    # Publication sur SNS
    sns = boto3.client("sns")
    sns.publish(
        TopicArn=os.environ["SNS_TOPIC"],
        Message=record_id,
    )

    return record_id
