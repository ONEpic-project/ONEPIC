
import os
import time
import urllib.request
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By

# -----------------------
# 설정
# -----------------------
SEARCH_QUERY = "Coca Cola 350ml can"
SAVE_DIR = "coca_cola_350ml"
NUM_IMAGES = 150   # 원하는 이미지 수

if not os.path.exists(SAVE_DIR):
    os.makedirs(SAVE_DIR)

# -----------------------
# 크롬 드라이버 실행
# -----------------------
options = webdriver.ChromeOptions()
options.add_argument("--headless")  # 창 띄우기 싫으면 유지
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
driver.get(f"https://www.google.com/search?q={SEARCH_QUERY}&tbm=isch")
time.sleep(2)

# -----------------------
# 스크롤 다운
# -----------------------
for _ in range(15):
    driver.execute_script("window.scrollBy(0, 10000);")
    time.sleep(1)

# -----------------------
# 이미지 태그 수집
# -----------------------
images = driver.find_elements(By.CSS_SELECTOR, "img.rg_i")

print(f"Found {len(images)} images")

count = 0
idx = 0

# -----------------------
# 이미지 다운로드
# -----------------------
for img in images:
    try:
        img.click()
        time.sleep(1)

        large_img = driver.find_element(By.CSS_SELECTOR, "img.n3VNCb")
        src = large_img.get_attribute("src")

        if src and "http" in src:
            filename = os.path.join(SAVE_DIR, f"coke_350ml_{idx}.jpg")
            urllib.request.urlretrieve(src, filename)
            print(f"Saved: {filename}")
            idx += 1
            count += 1

        if count >= NUM_IMAGES:
            break

    except Exception as e:
        pass

driver.quit()
print("✔ Done! Images saved in:", SAVE_DIR)
