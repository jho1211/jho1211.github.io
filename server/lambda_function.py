import os
from pymongo import MongoClient
import json

client = MongoClient(host=os.environ.get("ATLAS_URI"))

def get_courses(event, context):
    # Name of database
    db = client.courses 
    collection = db.courses 
    
    courses = list(collection.find(projection={'_id': False}))
    
    if courses:
        return {
        "statusCode": 200,
        "body": json.dumps(courses)
        }
    else:
        return {
        "statusCode": 503,
        "body": "There was an error accessing the database."
        }

def add_course(event, context):
    # Name of database
    db = client.courses 

    # Name of collection
    collection = db.courses 
    
    # Document to add inside
    document = event
    
    if not (collection.find_one({"name": event["name"]}) is None):
        return {
        "statusCode": 503,
        "body": "The specified course already exists."
        }

    # Insert document
    result = collection.insert_one(document)
    
    if result.inserted_id:
        return {
        'statusCode': 200,
        'body': event["name"] + " was successfully added to the database!"
        }
    else:
        return {
        'statusCode': 503,
        'body': 'There was an error adding the course to the database.'
        }
    
def update_course(event, context):
    # Name of database
    collection = client.courses.courses
    
    # Document to update
    document = json.loads(event["body"])
    repl = event["queryStringParameters"]["name"].replace("-", " ")
    headers = {"Access-Control-Allow-Origin": "*"}

    if collection.find_one({"name": repl}) is None:
        return {
            'statusCode': 503,
            'body': 'The course to be modified was not found in the database.',
            'headers': headers
        }


    # Insert document
    result = collection.replace_one({"name": repl}, document)
    
    if result.modified_count:
        return {
        'statusCode': 200,
        'body': 'The database was successfully updated!',
        'headers': headers
        }
    else:
        return {
            'statusCode': 503,
            'body': 'There was an error updating the course in the database.',
            'headers': headers
        }

def delete_course(event, context):
        collection = client.courses.courses
        to_del = event["queryStringParameters"]["name"].replace("-", " ")
        headers = {"Access-Control-Allow-Origin": "*"}

        if collection.find_one({"name": to_del}) is None:
            return {
                'statusCode': 503,
                'body': 'The specified course could not be found in the database.',
                'headers': headers
            }
        
        result = collection.delete_one(filter={"name": to_del})

        if result.deleted_count:
            return {
            'statusCode': 200,
            'body': 'The course was successfully removed from the database!',
            'headers': headers
            }
        else:
            return {
                'statusCode': 503,
                'body': 'There was an error deleting the course from the database.',
                'headers': headers
            }