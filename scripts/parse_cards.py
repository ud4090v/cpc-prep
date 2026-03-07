import docx
import json

# Function to parse the DOCX file
def parse_docx(file_path):
    doc = docx.Document(file_path)
    cards = []

    # Iterate through each section in the document
    system = None
    for paragraph in doc.paragraphs:
        if paragraph.style.name == 'Heading 1':
            system = paragraph.text.strip()  # Body system name
        elif ':' in paragraph.text and system:
            term, explanation = paragraph.text.split(':', 1)
            term = term.strip()
            explanation = explanation.strip()

            # Classify terms based on prefixes/suffixes/etc.
            if term.startswith("Epi-"):
                category = 'prefix'
            elif term.endswith("-itis"):
                category = 'suffix'
            else:
                category = 'combined_term'  # Placeholder

            card_id = f"{system.lower()}-{category}-{len(cards)+1:03d}"

            cards.append({
                'id': card_id,
                'system': system,
                'category': category,
                'term': term,
                'definition': explanation,
                'explanation': 'Context and importance in CPC coding.',
                'example': 'Example of usage here.',
                'difficulty': 'basic'
            })

    # Adding additional CPC standard terms
    standard_terms = [{'term': 'CPT Code', 'definition': 'Current Procedural Terminology', 'category': 'abbreviation'}]
    cards.extend(standard_terms)

    return cards

# Main function
def main():
    file_path = 'human_anatomy_study_guide.docx'  # Path to DOCX file
    cards = parse_docx(file_path)

    # Write output to JSON
    with open('data/cards.json', 'w') as f:
        json.dump(cards, f, indent=2)

if __name__ == '__main__':
    main()
