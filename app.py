from flask import Flask, jsonify, render_template, redirect, request
#make sure to pip install gunicorn in virtual environment for any flask app on heroku


app = Flask(__name__)

@app.route("/")
def welcome():
    return render_template("index.html") 



if __name__ == '__main__':
    app.run(debug=True)