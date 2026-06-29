"""
Justice Desk Court Classifier
Version 1.0

This module determines the originating court from
the judgment text rather than relying on URLs.
"""

import re


SUPREME_PATTERNS = [
    r"Supreme Court of India",
    r"IN THE SUPREME COURT OF INDIA",
    r"Supreme Court - Daily Orders",
]


HIGH_COURTS = {
    "Delhi High Court": [
        r"Delhi High Court",
        r"IN THE HIGH COURT OF DELHI",
    ],

    "Bombay High Court": [
        r"Bombay High Court",
        r"High Court of Judicature at Bombay",
    ],

    "Calcutta High Court": [
        r"Calcutta High Court",
    ],

    "Madras High Court": [
        r"Madras High Court",
    ],

    "Allahabad High Court": [
        r"Allahabad High Court",
    ],

    "Punjab and Haryana High Court": [
        r"Punjab and Haryana High Court",
        r"Punjab Haryana High Court",
    ],

    "Rajasthan High Court": [
        r"Rajasthan High Court",
    ],

    "Gujarat High Court": [
        r"Gujarat High Court",
    ],

    "Kerala High Court": [
        r"Kerala High Court",
    ],

    "Karnataka High Court": [
        r"Karnataka High Court",
    ],

    "Madhya Pradesh High Court": [
        r"Madhya Pradesh High Court",
    ],

    "Chhattisgarh High Court": [
        r"Chhattisgarh High Court",
    ],

    "Jharkhand High Court": [
        r"Jharkhand High Court",
    ],

    "Patna High Court": [
        r"Patna High Court",
    ],

    "Orissa High Court": [
        r"Orissa High Court",
    ],

    "Gauhati High Court": [
        r"Gauhati High Court",
    ],

    "Tripura High Court": [
        r"Tripura High Court",
    ],

    "Meghalaya High Court": [
        r"Meghalaya High Court",
    ],

    "Manipur High Court": [
        r"Manipur High Court",
    ],

    "Sikkim High Court": [
        r"Sikkim High Court",
    ],

    "Uttarakhand High Court": [
        r"Uttarakhand High Court",
    ],

    "Himachal Pradesh High Court": [
        r"Himachal Pradesh High Court",
    ],

    "Jammu & Kashmir High Court": [
        r"Jammu & Kashmir High Court",
        r"High Court of Jammu",
        r"High Court of Jammu & Kashmir",
        r"High Court of Jammu & Kashmir and Ladakh",
    ],

    "Telangana High Court": [
        r"Telangana High Court",
    ],

    "Andhra Pradesh High Court": [
        r"Andhra Pradesh High Court",
    ],
}


TRIBUNALS = {
    "Income Tax Appellate Tribunal": [
        r"Income Tax Appellate Tribunal",
        r"\bITAT\b",
    ],

    "CESTAT": [
        r"Customs, Excise",
        r"\bCESTAT\b",
    ],

    "National Company Law Tribunal": [
        r"National Company Law Tribunal",
        r"\bNCLT\b",
    ],

    "National Company Law Appellate Tribunal": [
        r"National Company Law Appellate Tribunal",
        r"\bNCLAT\b",
    ],

    "Central Administrative Tribunal": [
        r"Central Administrative Tribunal",
        r"\bCAT\b",
    ],

    "Armed Forces Tribunal": [
        r"Armed Forces Tribunal",
    ],
}


COMMISSIONS = {
    "Central Information Commission": [
        r"Central Information Commission",
    ],

    "State Information Commission": [
        r"State Information Commission",
    ],

    "National Consumer Commission": [
        r"National Consumer",
        r"NCDRC",
    ],
}
def classify_court(content: str) -> dict:
    """
    Returns:

    {
        "court_level": "...",
        "court_name": "...",
        "court_type": "..."
    }
    """

    if not content:
        return {
            "court_level": "unknown",
            "court_name": "Unknown",
            "court_type": "unknown",
        }

    text = content[:5000]

    # --------------------------------------------------
    # Supreme Court
    # --------------------------------------------------

    for pattern in SUPREME_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return {
                "court_level": "supreme_court",
                "court_name": "Supreme Court of India",
                "court_type": "constitutional",
            }

    # --------------------------------------------------
    # High Courts
    # --------------------------------------------------

    for court_name, patterns in HIGH_COURTS.items():

        for pattern in patterns:

            if re.search(pattern, text, re.IGNORECASE):

                return {
                    "court_level": "high_court",
                    "court_name": court_name,
                    "court_type": "constitutional",
                }

    # --------------------------------------------------
    # Tribunals
    # --------------------------------------------------

    for tribunal_name, patterns in TRIBUNALS.items():

        for pattern in patterns:

            if re.search(pattern, text, re.IGNORECASE):

                return {
                    "court_level": "tribunal",
                    "court_name": tribunal_name,
                    "court_type": "tribunal",
                }

    # --------------------------------------------------
    # Commissions
    # --------------------------------------------------

    for commission_name, patterns in COMMISSIONS.items():

        for pattern in patterns:

            if re.search(pattern, text, re.IGNORECASE):

                return {
                    "court_level": "commission",
                    "court_name": commission_name,
                    "court_type": "commission",
                }

    # --------------------------------------------------
    # District Courts
    # --------------------------------------------------

    if re.search(r"District Court", text, re.IGNORECASE):

        return {
            "court_level": "district_court",
            "court_name": "District Court",
            "court_type": "district",
        }

    # --------------------------------------------------
    # Family Court
    # --------------------------------------------------

    if re.search(r"Family Court", text, re.IGNORECASE):

        return {
            "court_level": "family_court",
            "court_name": "Family Court",
            "court_type": "district",
        }

    # --------------------------------------------------
    # Labour Court
    # --------------------------------------------------

    if re.search(r"Labour Court", text, re.IGNORECASE):

        return {
            "court_level": "labour_court",
            "court_name": "Labour Court",
            "court_type": "district",
        }

    # --------------------------------------------------
    # Unknown
    # --------------------------------------------------

    return {
        "court_level": "unknown",
        "court_name": "Unknown",
        "court_type": "unknown",
    }
# ---------------------------------------------------------------------
# Built-in test runner
# ---------------------------------------------------------------------

if __name__ == "__main__":

    samples = [

        """
        Supreme Court of India
        Sushila Aggarwal vs State (NCT Of Delhi)
        """,

        """
        Kerala High Court
        M. Sreenivasan vs Union of India
        """,

        """
        Bombay High Court
        Tata Capital Housing Finance Ltd.
        """,

        """
        Income Tax Appellate Tribunal
        Delhi Bench
        """,

        """
        Customs, Excise & Service Tax Appellate Tribunal
        """,

        """
        Central Information Commission
        New Delhi
        """,

        """
        National Company Law Tribunal
        Mumbai Bench
        """,

        """
        National Company Law Appellate Tribunal
        New Delhi
        """,

        """
        District Court Chandigarh
        """,

        """
        Family Court Chandigarh
        """,

        """
        Labour Court Punjab
        """,

    ]

    print("\n")
    print("=" * 70)
    print("JUSTICE DESK COURT CLASSIFIER TEST")
    print("=" * 70)

    for sample in samples:

        result = classify_court(sample)

        print("\n--------------------------------------------")
        print(sample.strip().split("\n")[0])

        print("Court Level :", result["court_level"])
        print("Court Name  :", result["court_name"])
        print("Court Type  :", result["court_type"])

    print("\n")
    print("=" * 70)
    print("Classifier ready for production.")
    print("=" * 70)
