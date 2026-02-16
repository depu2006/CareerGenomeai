import requests
from PyPDF2 import PdfWriter, PdfReader
import io
import time

def create_dummy_pdf():
    # Create a minimal PDF with some content
    # Since we can't easily "write" text with PyPDF2 without an existing page, 
    # and we don't have reportlab, we might have a problem creating a valid PDF from scratch.
    # COMPLETE HACK: We will try to download a tiny dummy PDF or just rely on a file if it exists.
    # Actually, let's just make the test script fail if it can't create a PDF, 
    # but since I am an AI, I can try to write a very basic raw PDF structure.
    
    pdf_content = (
        b"%PDF-1.1\n"
        b"1 0 obj\n"
        b"<< /Type /Catalog /Pages 2 0 R >>\n"
        b"endobj\n"
        b"2 0 obj\n"
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n"
        b"endobj\n"
        b"3 0 obj\n"
        b"<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\n"
        b"endobj\n"
        b"4 0 obj\n"
        b"<< /Length 44 >>\n"
        b"stream\n"
        b"BT /F1 24 Tf 100 700 Td (Python SQL React) Tj ET\n"
        b"endstream\n"
        b"endobj\n"
        b"xref\n"
        b"0 5\n"
        b"0000000000 65535 f \n"
        b"0000000010 00000 n \n"
        b"0000000060 00000 n \n"
        b"0000000117 00000 n \n"
        b"0000000283 00000 n \n"
        b"trailer\n"
        b"<< /Size 5 /Root 1 0 R >>\n"
        b"startxref\n"
        b"378\n"
        b"%%EOF\n"
    )
    return io.BytesIO(pdf_content)

def test_api():
    url = "http://localhost:5000/career-readiness"
    
    # Create dummy PDF in memory
    pdf_file = create_dummy_pdf()
    
    files = {'resume_file': ('resume.pdf', pdf_file, 'application/pdf')}
    data = {'job_description': 'We are looking for a developer with Python and SQL skills.'}
    
    try:
        print("Sending request to", url)
        response = requests.post(url, files=files, data=data)
        
        print(f"Status Code: {response.status_code}")
        print("Response Body:", response.json())
        
        if response.status_code == 200:
            print("TEST PASSED")
        else:
            print("TEST FAILED")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    # Wait a bit for server to likely be up
    time.sleep(2)
    test_api()
