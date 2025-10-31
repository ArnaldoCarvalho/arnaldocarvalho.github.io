# Novo arquivo: c:\Users\leand\OneDrive\Desktop\Projeto\app.py
from flask import Flask, render_template

app = Flask(__name__)

@app.route("/")
def index():
    fotos = [
        "blackshoes.png",
        "whiteshoes.jpg",
        "blackandwhite.jpg",
        "blackshoes.png",
        "whiteshoes.jpg",
        "blackandwhite.jpg",
    ]
    return render_template("index.html", fotos=fotos)

if __name__ == "__main__":
    app.run(debug=True)