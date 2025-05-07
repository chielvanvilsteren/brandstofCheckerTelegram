# webhook_listener.py

from flask import Flask, request
import subprocess

app = Flask(__name__)

REPO_PATH = "/home/chiel/BrandStofCheckerTelegram/brandstofCheckerTelegram"  # Pas dit aan naar jouw pad!

@app.route('/webhook', methods=['POST'])
def handle_webhook():
    print("ontvangst: webhook!")
    
    # Git pull uitvoeren
    result = subprocess.run(['git', '-C', REPO_PATH, 'pull'], stdout=subprocess.PIPE)
    output = result.stdout.decode()
    print("Git output:\n", output)

    # Optioneel: Herstart je app
    subprocess.run(['sh', f'{REPO_PATH}/restart_app.sh'])

    return "Webhook ontvangen en verwerkt!", 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)