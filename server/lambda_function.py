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

    # Insert document
    result = collection.insert_one(document)
    
    if result.inserted_id:
        return {
        'statusCode': 200,
        'body': 'The database was successfully updated!'
        }
    else:
        return {
            'statusCode': 503,
            'body': 'There was an error saving the database.'
        }
    
def update_course(event, context):
    # Name of database
    collection = client.courses.courses
    
    # Document to update
    document = event["new_document"]

    if collection.find_one({"name": event["old_name"]}) is None:
        return {
            'statusCode': 503,
            'body': 'The course to be modified was not found in the database.'
        }


    # Insert document
    result = collection.replace_one(filter={"name": event["old_name"]}, update=document)
    
    if result.modified_count:
        return {
        'statusCode': 200,
        'body': 'The database was successfully updated!'
        }
    else:
        return {
            'statusCode': 503,
            'body': 'There was an error updating the course in the database.'
        }

def delete_course(event, context):
    collection = client.courses.courses
    to_del = event["name"]

    if collection.find_one({"name": to_del}) is None:
        return {
            'statusCode': 503,
            'body': 'The specified course could not be found in the database.'
        }
    
    result = collection.delete_one(filter={"name": to_del})

    if result.deleted_count:
        return {
        'statusCode': 200,
        'body': 'The course was successfully removed from the database!'
        }
    else:
        return {
            'statusCode': 503,
            'body': 'There was an error deleting the course from the database.'
        }