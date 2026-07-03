import boto3
import os
import json
from contextlib import closing

def lambda_handler(event, context):
    # L'événement arrive depuis SNS
    post_id = event["Records"][0]["Sns"]["Message"]

    # Lecture du post dans DynamoDB
    dynamodb = boto3.resource("dynamodb")
    table = dynamodb.Table(os.environ["DB_TABLE_NAME"])
    item = table.get_item(Key={"id": post_id})["Item"]

    text = item["text"]
    voice = item["voice"]
    user = item["user"]

    # Synthèse vocale avec Polly
    polly = boto3.client("polly")

    # Découpage en blocs de ~1000 caractères (limite Polly = 3000)
    blocks = [text[i : i + 1000] for i in range(0, len(text), 1000)]
    audio_data = b""

    for block in blocks:
        response = polly.synthesize_speech(
            Text=block,
            OutputFormat="mp3",
            VoiceId=voice,
        )
        with closing(response["AudioStream"]) as stream:
            audio_data += stream.read()

    # Upload du MP3 dans S3
    s3 = boto3.client("s3")
    bucket = os.environ["BUCKET_NAME"]
    key = f"{user}/{post_id}.mp3"

    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=audio_data,
        ContentType="audio/mpeg",
    )

    # Construction de l'URL publique
    region = os.environ.get("AWS_REGION", "eu-west-3")
    url = f"https://{bucket}.s3.{region}.amazonaws.com/{key}"

    # Mise à jour de DynamoDB
    table.update_item(
        Key={"id": post_id},
        UpdateExpression="SET #s = :s, #u = :u",
        ExpressionAttributeNames={"#s": "status", "#u": "url"},
        ExpressionAttributeValues={":s": "UPDATED", ":u": url},
    )

    return {"statusCode": 200, "body": json.dumps({"postId": post_id, "url": url})}
