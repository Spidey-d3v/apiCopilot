import yaml
import json
import os

dataset_dir = "dataset"
os.makedirs(dataset_dir, exist_ok=True)

# 1. STRIPE - Massive OpenAPI 3.0 YAML (Multiple Endpoints)
stripe_openapi = {
    "openapi": "3.0.3",
    "info": {
        "title": "Stripe Full API",
        "version": "v1",
        "description": "Comprehensive B2B Payment processing API."
    },
    "servers": [{"url": "https://api.stripe.com/v1"}],
    "paths": {
        "/customers": {
            "post": {
                "summary": "Create a customer",
                "description": "Creates a new customer object.",
                "requestBody": {
                    "content": {
                        "application/x-www-form-urlencoded": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "email": {"type": "string"},
                                    "name": {"type": "string"}
                                }
                            }
                        }
                    }
                }
            },
            "get": {
                "summary": "List all customers",
                "parameters": [
                    {"name": "limit", "in": "query", "schema": {"type": "integer"}}
                ]
            }
        },
        "/payment_intents": {
            "post": {
                "summary": "Create a PaymentIntent",
                "requestBody": {
                    "content": {
                        "application/x-www-form-urlencoded": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "amount": {"type": "integer"},
                                    "currency": {"type": "string"},
                                    "customer": {"type": "string"}
                                }
                            }
                        }
                    }
                }
            }
        },
        "/subscriptions": {
            "post": {
                "summary": "Create a Subscription",
                "description": "Subscribes a customer to a specific price plan.",
                "requestBody": {
                    "content": {
                        "application/x-www-form-urlencoded": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "customer": {"type": "string"},
                                    "items[0][price]": {"type": "string"}
                                }
                            }
                        }
                    }
                }
            }
        },
        "/invoices": {
            "get": {
                "summary": "List all invoices",
                "parameters": [
                    {"name": "customer", "in": "query", "schema": {"type": "string"}}
                ]
            }
        }
    }
}

# 2. SENDGRID - Legacy Swagger 2.0 JSON (Different Structure)
sendgrid_swagger2 = {
    "swagger": "2.0",
    "info": {
        "title": "SendGrid V3 API (Swagger 2.0)",
        "version": "3.0.0"
    },
    "host": "api.sendgrid.com",
    "basePath": "/v3",
    "paths": {
        "/mail/send": {
            "post": {
                "summary": "Send an email",
                "parameters": [
                    {
                        "in": "body",
                        "name": "body",
                        "required": True,
                        "schema": {
                            "$ref": "#/definitions/MailSendRequest"
                        }
                    }
                ]
            }
        },
        "/templates": {
            "get": {
                "summary": "Retrieve all transactional templates",
                "responses": {
                    "200": {"description": "List of templates"}
                }
            }
        }
    },
    "definitions": {
        "MailSendRequest": {
            "type": "object",
            "properties": {
                "personalizations": {"type": "array"},
                "from": {"type": "object", "properties": {"email": {"type": "string"}}},
                "subject": {"type": "string"}
            }
        }
    }
}

# 3. SLACK - Unstructured Markdown Documentation (Developer Portal Style)
slack_markdown = """# Slack API Developer Guide

Welcome to the Slack API! Unlike traditional REST specs, here is how you use our API.

## Authentication
All requests must include a Bearer token in the header: `Authorization: Bearer xoxb-your-token`.

## POST /api/chat.postMessage
Sends a message to a channel.
**Content-Type:** application/json

**Payload:**
- `channel` (string, required): The ID of the channel.
- `text` (string, required): The message content.
- `blocks` (array, optional): UI blocks for rich formatting.

## GET /api/users.list
Returns a list of all users in the workspace.
**Query Parameters:**
- `limit` (integer): Number of users to return.
- `cursor` (string): Pagination cursor.
"""

# 4. TWILIO - Postman Collection Format (Deeply Nested Array Structure)
twilio_postman = {
    "info": {
        "name": "Twilio Communication API",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "Send SMS",
            "request": {
                "method": "POST",
                "header": [{"key": "Authorization", "value": "Basic {{auth}}"}],
                "url": {
                    "raw": "https://api.twilio.com/2010-04-01/Accounts/:AccountSid/Messages.json",
                    "host": ["https://api.twilio.com"],
                    "path": ["2010-04-01", "Accounts", ":AccountSid", "Messages.json"]
                },
                "body": {
                    "mode": "urlencoded",
                    "urlencoded": [
                        {"key": "To", "value": "+1234567890"},
                        {"key": "From", "value": "+0987654321"},
                        {"key": "Body", "value": "Hello World"}
                    ]
                }
            }
        },
        {
            "name": "Fetch Call Logs",
            "request": {
                "method": "GET",
                "url": {
                    "raw": "https://api.twilio.com/2010-04-01/Accounts/:AccountSid/Calls.json",
                    "host": ["https://api.twilio.com"],
                    "path": ["2010-04-01", "Accounts", ":AccountSid", "Calls.json"]
                }
            }
        }
    ]
}

# Write files
with open(os.path.join(dataset_dir, "stripe_full_openapi.yaml"), 'w') as f:
    yaml.dump(stripe_openapi, f, sort_keys=False)

with open(os.path.join(dataset_dir, "sendgrid_swagger_2.json"), 'w') as f:
    json.dump(sendgrid_swagger2, f, indent=4)

with open(os.path.join(dataset_dir, "slack_dev_guide.md"), 'w') as f:
    f.write(slack_markdown)

with open(os.path.join(dataset_dir, "twilio_postman_collection.json"), 'w') as f:
    json.dump(twilio_postman, f, indent=4)

print("Heterogeneous B2B Database generation complete.")
