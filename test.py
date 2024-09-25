from flask import Flask, render_template, jsonify, request
from pymongo import MongoClient
from bson.objectid import ObjectId
from pymongo.errors import PyMongoError
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Connect to MongoDB
try:
    client = MongoClient('mongodb://localhost:27017/')
    work_db = client['work_tracker']  # Database for work tracking
    work_collection = work_db['works']  # Collection for works
    user_db = client['user_data']  # Database for user data
    user_collection = user_db['users']  # Collection for users
except PyMongoError as e:
    print(f"Error connecting to MongoDB: {e}")

# Route for the login or sign up
@app.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if 'txt' in request.form:  # Sign-up logic
            username = request.form['txt']
            email = request.form['email']
            password = request.form['pswd']
            user_data = {'username': username, 'email': email, 'password': password}
            user_collection.insert_one(user_data)
            return jsonify({'status': 'success', 'message': 'Sign up successful!'})
        elif 'email' in request.form and 'pswd' in request.form:  # Login logic
            email = request.form['email']
            password = request.form['pswd']
            user = user_collection.find_one({'email': email, 'password': password})
            if user:
                return jsonify({'status': 'success', 'message': 'Welcome back!'})
            else:
                return jsonify({'status': 'fail', 'message': 'Login failed. Please try again.'})
    return render_template('login.html')

# Route for the work page
@app.route('/work')
def work():
    return render_template('work.html')

# Route to get all work items
@app.route('/works', methods=['GET'])
def get_works():
    try:
        works = list(work_collection.find())
        for work in works:
            work['_id'] = str(work['_id'])  # Convert ObjectId to string for JSON serialization
        return jsonify(works)
    except PyMongoError as e:
        return jsonify({'error': f'Failed to fetch works: {e}'}), 500

# Route to add a new work item
@app.route('/works', methods=['POST'])
def add_work():
    data = request.json
    if not data or 'work' not in data or 'description' not in data or 'type' not in data:
        return jsonify({'error': 'Invalid data format'}), 400
    try:
        result = work_collection.insert_one(data)
        return jsonify({'message': 'Work added successfully'}), 201
    except PyMongoError as e:
        return jsonify({'error': f'Failed to add work: {e}'}), 500

# Route to update a work item
@app.route('/works/<id>', methods=['PUT'])
def update_work(id):
    data = request.json
    try:
        result = work_collection.update_one({'_id': ObjectId(id)}, {"$set": data})
        if result.matched_count == 1:
            return jsonify({'message': 'Work updated successfully'}), 200
        else:
            return jsonify({'error': 'Work not found'}), 404
    except PyMongoError as e:
        return jsonify({'error': f'Failed to update work: {e}'}), 500

# Route to delete a work item
@app.route('/works/<id>', methods=['DELETE'])
def delete_work(id):
    try:
        result = work_collection.delete_one({'_id': ObjectId(id)})
        if result.deleted_count == 1:
            return jsonify({'message': 'Work deleted successfully'}), 200
        else:
            return jsonify({'error': 'Work not found'}), 404
    except PyMongoError as e:
        return jsonify({'error': f'Failed to delete work: {e}'}), 500

if __name__ == '__main__':
    app.run(debug=True)
