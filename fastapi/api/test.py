import PyPDF2

with open("/home/sks/tutoref/fastapi/api/2023台大山服夏令營_霧鹿家_高年級自然_召喚電之子_宋凱翔_20230625.pdf", 'rb') as file:
    reader = PyPDF2.PdfReader(file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    print(text)