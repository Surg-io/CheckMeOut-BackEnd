#Code for Barcode Scanner
from time import sleep

import requests
import cv2
import webbrowser
import winsound

cap = cv2.VideoCapture(0)
detector = cv2.QRCodeDetector()

while True:
    _, img = cap.read()
    data, bbox, _ = detector.detectAndDecode(img)
    if data:
        print(data)
        response = requests.post("http://localhost:8000/scan", json={"ID": data})
        print(response)
        frequency = 900
        duration = 500
        winsound.Beep(frequency,duration)
        sleep(5)
    cv2.imshow("QRCODEscanner", img)
    if cv2.waitKey(1) == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()

