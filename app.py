from flask import Flask, jsonify, render_template, redirect, request

app = Flask(__name__)


@app.route("/")
def welcome():
    return render_template("index.html")

# Leaving a comment for future Jason


if __name__ == '__main__':
    app.run(debug=True)
