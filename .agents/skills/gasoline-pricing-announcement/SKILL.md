---
name: gasoline-pricing-announcement
description: Workflow to process and generate a new gasoline pricing announcement. Extracts pricing, dates, and other required information from raw text, verifies completeness, and formats a standardized announcement. Use this when the user asks to process or generate a fuel/gasoline price update.
---

# Gasoline Pricing Announcement

This skill defines the workflow for creating a structured, standardized gasoline pricing announcement from raw input (e.g., an official text or a user's rough notes).

## Workflow Steps

### 1. Information Gathering

If the user invokes this skill without providing the source information, ask them to provide the raw gasoline announcement (text, image description, or raw data).

### 2. Information Extraction

Analyze the provided information and extract the full pricing breakdown into a hierarchical JSON structure according to the extraction schema (e.g., `prompt.md` in the system). Key required fields include:

- **Effective Start Date & Time**: When the new prices come into effect.
- **Effective End Date & Time**: When these prices expire (if provided).
- **Issuing Authority**: (e.g., Ministry of Commerce, specific fuel company).
- **Detailed Fuel Pricing Breakdown** (for Regular EA92, Super EA95, Diesel, and any others):
  - **MOPS** (Mean of Platts Singapore or base international price)
  - **Taxes**: Must be extracted hierarchically, capturing the `total` tax and individual components like `customDuty` (ពន្ធគយ), `additionalTax` (អាករបន្ថែម), `specialTax` (អាករពិសេស), and any others inside `extra`.
  - **Premiums**, **VAT**, and **Subtotals** (e.g. `subtotalUSD` before margins).
  - **Distribution Margin** & **Discounts**.
  - **Final Retail Price** (in USD and KHR).
- **Government Measures**: Numbered list of government measures.
- **Notes**: Exchange rate info, sales policy, pre-tax prices.

Ensure that NO row from the announcement's pricing table is lost. Any unknown parent rows should be preserved in an `extra` object at the root of the fuel type.

### 3. Validation Phase

Check the extracted data against the required fields list.

- **Missing Data**: If any critical fields (Start Date, Fuel Types & Prices) are missing, **STOP** and ask the user to provide the missing information.
- **Confirmation**: If all data is present, you may proceed.

### 4. Generation Phase

Draft the finalized gasoline pricing announcement using a clean, professional, and easily readable format.

### 5. Standard Output Template

Use the following markdown template for the final output, adjusting as needed based on the provided data. Output the final markdown exactly matching this structure (in Khmer):

```markdown
# ព័ត៌មានសេចក្តីជូនដំណឹង

| ប្រធានបទ                 | ព័ត៌មាន                  |
| ------------------------ | ------------------------ |
| ក្រសួង                   | [Ministry]               |
| លេខ                      | [Document Number]        |
| ប្រភេទឯកសារ              | [Document Type]          |
| កាលបរិច្ឆេទ              | [Gregorian Date]         |
| ថ្ងៃខ្មែរ                | [Khmer Date]             |
| ទីកន្លែងចេញ              | [Issued Location]        |
| កម្មវត្ថុ                | [Subject]                |
| អនុវត្តចាប់ពី            | [Effective Start]        |
| អនុវត្តដល់               | [Effective End]          |
| អត្រាប្ដូរប្រាក់ផ្លូវការ | [Official Exchange Rate] |

# តម្លៃលក់រាយ

| ប្រភេទប្រេង                   |  តម្លៃ (រៀល/លីត្រ) |
| ----------------------------- | -----------------: |
| ប្រេងសាំងធម្មតា (Gasoline 92) | [Retail Price KHR] |
| ប្រេងម៉ាស៊ូត (Gasoil 10ppm)   | [Retail Price KHR] |

# តារាងថ្លៃលក់រាយប្រេងឥន្ធនៈ

| ល.រ | មេ (Parent) | អធិប្បាយ | ប្រេងសាំងធម្មតា (Gasoline 92) | ប្រេងម៉ាស៊ូត (Gasoil 10ppm) |
| :-: | :---------: | -------- | ----------------------------: | --------------------------: |
| ... |     ...     | ...      |                           ... |                         ... |

# វិធានការរបស់រាជរដ្ឋាភិបាល

| ល.រ | វិធានការ    |
| :-: | ----------- |
| ... | [Measure 1] |
| ... | [Measure 2] |

# សម្គាល់

| ប្រធានបទ              | ព័ត៌មាន                 |
| --------------------- | ----------------------- |
| តម្លៃមុនការបញ្ចុះពន្ធ | [Pre-tax prices]        |
| អត្រាប្ដូរប្រាក់      | [Exchange rate info]    |
| ការលក់                | [Sales policy]          |
| កាលវិភាគប្រកាស        | [Announcement schedule] |
```

Ensure the final output is accurate and matches the raw input exactly. Do not hallucinate prices or dates.
