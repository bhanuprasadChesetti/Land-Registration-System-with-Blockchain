from flask import Flask, jsonify,render_template,request,Response,redirect, session
from pymongo import MongoClient
import gridfs
from web3 import Web3, HTTPProvider
from werkzeug.security import generate_password_hash, check_password_hash
import os
import json 

# our own module
from utility.mapRevenueDeptToEmployee import mapRevenueDeptIdToEmployee

# Get configuration info

with open("config.json","r") as f:
    config = json.load(f)



# admin address
adminAddress = config["Address_Used_To_Deploy_Contract"]

# admin password
adminPassword = config["Admin_Password"]


# blockchain Network ID
NETWORK_CHAIN_ID = str(config["NETWORK_CHAIN_ID"])



# connect to mong db
client = MongoClient(config["Mongo_Db_Url"])

# connect to database
LandRegistryDB = client.LandRegistry

# connect to file System
fs = gridfs.GridFS(LandRegistryDB)

# property collection
propertyDocsTable = LandRegistryDB.Property_Docs

# employee collection
employeesTable = client.Revenue_Dept.Employees


# flask app
app = Flask(__name__)


# flask secret key
app.secret_key = config["Secret_Key"]



@app.route('/')
def index():
    # Render the 'index.html' template with the variables passed in
    return render_template('index.html')



@app.route("/login", methods=['POST'])
def login():

    if request.method == 'POST':
        employeeId = request.form['employeeId']
        password = request.form['password']

        
        user = employeesTable.find_one({"employeeId":employeeId})

        
        if user and check_password_hash(user['password'], password):
            session['user_id'] = str(user['_id'])
            return jsonify({'status':1,
                            "msg":'Login Success',
                            "revenueDepartmentId":user['revenueDeptId'],
                            "empName":user['fname']
                            })
        else:
            return jsonify({'status':0,"msg":'Invalid Wallet or password'})

    else:
        return jsonify({'status':0,"msg":'GET Not allowed'})



@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect('/')


@app.route('/dashboard')
def dashboard():
    if 'user_id' in session:
        return render_template('dashboard.html')
    else:
        return redirect('/')


@app.route('/propertiesDocs/pdf/<propertyId>')
def get_pdf(propertyId):
  try:
    try:
        propertyDetails = propertyDocsTable.find({"Property_Id":"%s"%(propertyId)})[0]
        
    except IndexError as e:
        return jsonify({"status":0,"Reason":"No Property Matched With Id"})

    fileName = "%s_%s.pdf"%(propertyDetails['Owner'],propertyDetails['Property_Id'])
    
    file = fs.get(propertyDetails[fileName])

    response = Response(file, content_type='application/pdf')
    response.headers['Content-Disposition'] = f'inline; filename="{file.filename}"'
    
    return response

  except Exception as e:
    return jsonify({"status":0,"Reason":str(e)})






@app.route('/fetchContractDetails')
def fetchContractDetails():
    usersContract = json.loads(
            open(
                    os.getcwd()+
                    "/../"+"Smart_contracts/build/contracts/"+
                    "Users.json"
                    ).read()
        )
    
    landRegistryContract = json.loads(
            open(
                    os.getcwd()+
                    "/../"+"Smart_contracts/build/contracts/"+
                    "LandRegistry.json"
                    ).read()
        )

    transferOwnerShip = json.loads(
            open(
                    os.getcwd()+
                    "/../"+"Smart_contracts/build/contracts/"+
                    "TransferOwnerShip.json"
                    ).read()
        )

    response = {}

    response["Users"] = {}
    response["Users"]["address"] = usersContract["networks"][NETWORK_CHAIN_ID]["address"]
    response["Users"]["abi"] = usersContract["abi"]

    response["LandRegistry"]  = {}
    response["LandRegistry"]["address"] = landRegistryContract["networks"][NETWORK_CHAIN_ID]["address"]
    response["LandRegistry"]["abi"] = landRegistryContract["abi"]

    response["TransferOwnership"]  = {}
    response["TransferOwnership"]["address"] = transferOwnerShip["networks"][NETWORK_CHAIN_ID]["address"]
    response["TransferOwnership"]["abi"] = transferOwnerShip["abi"]


    return response



@app.route('/admin')
def adminIndexPage():
    return render_template('admin.html')





@app.route("/adminLogin", methods=['POST'])
def adminLogin():



    if request.method == 'POST':
        adminAddress = request.form['adminAddress']
        password = request.form['password']

        admin = employeesTable.find_one({'adminAddress': adminAddress})


        if admin and check_password_hash(admin['password'], password):
            session['user_id'] = str(admin['_id'])
            return jsonify({'status':1,
                            "msg":'Admin Login Success'
                            })
        else:
            return jsonify({'status':0,"msg":'Invalid Wallet or password'})

    else:
        return jsonify({'status':0,"msg":'GET Not allowed'})






@app.route("/addEmployee", methods=['POST'])
def addEmployee():
    
    if 'user_id' not in session:
        return jsonify({'status':0,"msg":'Login Required'})
   
    if request.method == 'POST':
        employeeId = request.form['empAddress']
        password = request.form['password']
        fname = request.form['fname']
        lname = request.form['lname']
        revenueDeptId = request.form['revenueDeptId']


        emp = {
            "employeeId":employeeId,
            "password":generate_password_hash(password),
            "fname":fname,
            "lname":lname,
            "revenueDeptId":revenueDeptId
        }

        try:

            # add to mongo db database
            result = employeesTable.insert_one(emp)

            
            # make transaction to map revenue dept id to employee address
            res = mapRevenueDeptIdToEmployee(revenueDeptId,employeeId)

            if res:
                return jsonify({
                            'status':1,
                            "msg":f"Employee '{fname}' Added Successfully"
                            })
            else:
                return jsonify({
                            'status':0,
                            "msg":f"Transaction Failed"
                            })

        except Exception as e:
            return jsonify({
                            'status':0,
                            "msg": str(e)
                         })

    else:
        return jsonify({'status':0,"msg":'GET Not allowed'})






if __name__ == '__main__':

    # Check Admin Account is Created or Not
    if((adminAddress is not None) and (adminPassword is not None)):

        admin = employeesTable.find_one({'adminAddress': adminAddress})

        # admin account not added to employees table
        if admin is None:
            print("\nAdding Admin Details To Database")

            admin = {
                "adminAddress":adminAddress,
                "password":generate_password_hash(adminPassword)
            }


            adminId = employeesTable.insert_one(admin).inserted_id

            if adminId is not None:
                print("Added Successfully")
            else:
                print("Failed to add Details")
                exit(0)
       
        # Start Server
        app.run(debug=True,port=5001)

    else:
        print("Admin Address Details Not found in Configuration file")
