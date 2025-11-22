import openai
from pypdf import PdfReader
import io
import os
import json
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

def extract_text_from_pdf(file_content: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_content))
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def analyze_with_openai(text: str):
    prompt = f"""
    Analiza el siguiente texto extraído de un documento PDF.
    Determina si corresponde a un Formulario 22 (F22) del SII de Chile.
    Si es un F22, extrae los siguientes datos:
    - Identificación y giro (Nombre o Razón Social)
    - Ingresos (Total Ingresos)
    - Gastos rechazados
    - Base imponible
    - Créditos (con/sin devolución)
    - Impuesto total pagado

    Devuelve la respuesta EXCLUSIVAMENTE en formato JSON con la siguiente estructura:
    {{
        "is_f22": boolean,
        "data": {{
            "identificacion_giro": "string",
            "ingresos": "string",
            "gastos_rechazados": "string",
            "base_imponible": "string",
            "creditos": "string",
            "impuesto_total_pagado": "string"
        }}
    }}
    Si no encuentras algún dato, pon null.

    Texto del PDF:
    {text[:4000]}  # Truncate to avoid token limits if necessary, but F22 is usually short enough.
    """

    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo", # Or gpt-4 if available/needed
            messages=[
                {"role": "system", "content": "Eres un experto contable capaz de extraer datos de formularios de impuestos."},
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )
        content = response.choices[0].message.content
        # Clean up potential markdown code blocks
        content = content.replace("```json", "").replace("```", "").strip()
        return json.loads(content)
    except Exception as e:
        print(f"Error calling OpenAI: {e}")
        return {"is_f22": False, "data": {}, "error": str(e)}
