import re
from typing import Optional, Dict, Any, List

def process_civic_chat(
    message: str,
    complaints_snapshot: List[Dict[str, Any]]
) -> str:
    """
    Bilingual (English & Hindi) Local Civic Knowledge Assistant.
    Provides ticket tracking, complaint filing instructions, emergency helplines,
    department SLA matrices, and ward directory information.
    """
    msg_clean = message.strip()
    is_hindi = bool(re.search(r"[\u0900-\u097F]", msg_clean))
    lower = msg_clean.lower()

    # 1. Ticket Number Lookup
    ticket_match = re.search(r"CIV-2026-\d+|CIV-\d+", msg_clean, re.IGNORECASE)
    if ticket_match:
        target_ticket = ticket_match.group(0).upper()
        found = next((c for c in complaints_snapshot if c.get("ticket_number", "").upper() == target_ticket), None)
        if found:
            if is_hindi:
                return (
                    f"### शिकायत विवरण: **{found['ticket_number']}**\n\n"
                    f"• **शीर्षक:** {found.get('title', '')}\n"
                    f"• **स्थिति:** `{found.get('status', 'Submitted')}`\n"
                    f"• **श्रेणी:** {found.get('category', '')}\n"
                    f"• **वार्ड:** {found.get('ward', '')}\n"
                    f"• **आवंटित विभाग:** {found.get('department_assigned', 'सड़क एवं अवसंरचना')}\n"
                    f"• **प्रभारी अधिकारी:** {found.get('officer_assigned', 'इंजीनियर विक्रम सेठी')}\n\n"
                    f"आप **Citizen Portal** पर इस शिकायत की वास्तविक समय स्थिति और प्रगति देख सकते हैं।"
                )
            else:
                return (
                    f"### Ticket Details for **{found['ticket_number']}**\n\n"
                    f"• **Title:** {found.get('title', '')}\n"
                    f"• **Status:** `{found.get('status', 'Submitted')}`\n"
                    f"• **Category:** {found.get('category', '')}\n"
                    f"• **Ward:** {found.get('ward', '')}\n"
                    f"• **Assigned Dept:** {found.get('department_assigned', 'Roads & Infrastructure')}\n"
                    f"• **Assigned Officer:** {found.get('officer_assigned', 'Eng. Vikram Sethi')}\n\n"
                    f"You can view live updates and verify completion in the **Citizen Portal** timeline."
                )
        else:
            if is_hindi:
                return f"डेटाबेस में **{target_ticket}** से संबंधित कोई शिकायत नहीं मिली। कृपया टिकट नंबर की जांच करें।"
            else:
                return f"I searched our local municipal database, but could not find a ticket matching **{target_ticket}**. Please verify your ticket ID on your receipt or in your Citizen Dashboard."

    # 2. How to Report an Issue
    if any(k in lower for k in ["report", "file", "how to", "शिकायत", "दर्ज", "पंजीकृत"]):
        if is_hindi:
            return (
                "### CivicPulse पर शिकायत दर्ज करने की प्रक्रिया\n\n"
                "1. मुख्य नेविगेशन में **\"Report an Issue\"** बटन पर क्लिक करें।\n"
                "2. **साक्ष्य अपलोड:** समस्या (गड्ढा, कचरा, लीकेज) की स्पष्ट फोटो अपलोड करें।\n"
                "3. **स्थानीय AI वर्गीकरण:** हमारा ऑन-प्रिमाइसेस AI स्वतः समस्या की श्रेणी व प्राथमिकता निर्धारित करता है।\n"
                "4. **स्थान चयन:** इंटरैक्टिव GIS मानचित्र पर स्थान चुनें या जीपीएस ऑटो-डिटेक्ट चालू करें।\n"
                "5. **सबमिट:** आपको तुरंत यूनिक ट्रैकिंग आईडी और डिजिटल क्यूआर कोड प्राप्त होगा।"
            )
        else:
            return (
                "### How to File a Civic Complaint on CivicPulse\n\n"
                "1. Click the **\"Report an Issue\"** button in the top navigation bar or citizen dashboard.\n"
                "2. **Upload Evidence:** Select or capture a photo of the damaged road, street light, or garbage heap.\n"
                "3. **Local AI Auto-Triage:** Our on-premise AI automatically detects the category, priority, and assigns the responsible department.\n"
                "4. **Select Location:** Tap on the interactive GIS map or enable GPS auto-detect.\n"
                "5. **Submit:** Receive your instant tracking ticket ID and QR code!"
            )

    # 3. Helplines & Emergency Contacts
    if any(k in lower for k in ["helpline", "contact", "phone", "emergency", "नंबर", "हेल्पलाइन", "फोन"]):
        if is_hindi:
            return (
                "### नगर निगम आपातकालीन एवं विभागीय हेल्पलाइन\n\n"
                "• **24/7 नागरिक टोल-फ्री:** 1800-233-CIVIC (1800-233-2484)\n"
                "• **आपदा एवं आपातकालीन नियंत्रण कक्ष:** 112\n"
                "• **ठोस अपशिष्ट एवं स्वच्छता हेल्पलाइन:** 1800-555-WASTE\n"
                "• **जल आपूर्ति एवं सीवर आपातकाल:** 1800-444-WATER\n"
                "• **स्ट्रीटलाइट एवं विद्युत मरम्मत:** 1800-777-LIGHT\n\n"
                "*नगर निगम केंद्रीय नियंत्रण कक्ष 24 घंटे कार्यरत रहता है।*"
            )
        else:
            return (
                "### Municipal Emergency & Department Helplines\n\n"
                "• **24/7 Civic Toll-Free:** 1800-233-CIVIC (1800-233-2484)\n"
                "• **Disaster & Emergency Control:** 112\n"
                "• **Solid Waste & Sanitation:** 1800-555-WASTE\n"
                "• **Water Supply Leakage:** 1800-444-WATER\n"
                "• **Streetlighting Repair:** 1800-777-LIGHT\n\n"
                "*Municipal Control Center operates 24/7 at City Hall.*"
            )

    # 4. Department & Ward Matrix
    if any(k in lower for k in ["department", "ward", "विभाग", "वार्ड"]):
        if is_hindi:
            return (
                "### नगर निगम विभाग एवं वार्ड कवरेज\n\n"
                "CivicPulse शहर के 6 प्रमुख वार्डों में 7 विभागों को एकीकृत करता है:\n\n"
                "1. **सड़क एवं अवसंरचना:** सड़क के गड्ढे, पेवर ब्लॉक, डिवाइडर मरम्मत\n"
                "2. **ठोस अपशिष्ट एवं स्वच्छता:** कचरा डिपो, डस्टबिन ओवरफ्लो, सफाई\n"
                "3. **जल आपूर्ति एवं सीवेज:** पाइपलाइन लीकेज, गंदा पानी, जल दबाव\n"
                "4. **विद्युत एवं स्ट्रीटलाइट:** बंद बत्तियां, ढीले तार, नया पोल\n"
                "5. **जल निकासी एवं बरसाती नाले:** नाला चोक, जलभराव निवारण\n"
                "6. **उद्यान एवं बागवानी:** गिरे हुए पेड़, शाखा छंटाई, पार्क रखरखाव\n"
                "7. **सार्वजनिक स्वास्थ्य एवं अतिक्रमण:** कीटनाशक छिड़काव, अवैध कब्जा हटाना"
            )
        else:
            return (
                "### Municipal Departments & Ward Coverage\n\n"
                "CivicPulse integrates 7 core municipal departments across 6 urban wards:\n\n"
                "1. **Roads & Infrastructure** (Potholes, pavers, road cuts)\n"
                "2. **Solid Waste & Sanitation** (Garbage dumps, bin overflowing)\n"
                "3. **Water Supply & Sewage** (Pipeline bursts, contaminated water)\n"
                "4. **Electrical & Streetlighting** (Dark streets, hanging wires)\n"
                "5. **Drainage & Stormwater** (Waterlogging, choked drains)\n"
                "6. **Parks & Horticulture** (Fallen trees, overgrown parks)\n"
                "7. **Public Health & Encroachment** (Stray animals, illegal stalls)"
            )

    # 5. SLA Timelines
    if any(k in lower for k in ["sla", "time", "hour", "समय", "कितना समय"]):
        if is_hindi:
            return (
                "### नगर निगम संकल्प समय-सीमा (SLA Matrix)\n\n"
                "• **क्रिटिकल (Critical):** 4 घंटे के भीतर निवारण\n"
                "• **उच्च (High):** 12 घंटे के भीतर निवारण\n"
                "• **मध्यम (Medium):** 24 घंटे के भीतर निवारण\n"
                "• **सामान्य (Low):** 48 घंटे के भीतर निवारण"
            )
        else:
            return (
                "### Municipal Service Level Agreement (SLA Matrix)\n\n"
                "• **Critical Priority:** < 4 hours emergency response\n"
                "• **High Priority:** < 12 hours resolution target\n"
                "• **Medium Priority:** < 24 hours standard dispatch\n"
                "• **Low Priority:** < 48 hours scheduled maintenance"
            )

    # Default Concierge
    if is_hindi:
        return (
            "नमस्ते! मैं **CivicPulse AI** हूँ, आपका 24/7 स्थानीय स्मार्ट सिटी नगर निगम सहायक।\n\n"
            "मैं आपकी निम्नलिखित में सहायता कर सकता हूँ:\n"
            "• शिकायत स्थिति ट्रैकिंग (उदा. \"CIV-2026-8812 की स्थिति\")\n"
            "• नई शिकायत दर्ज करने के नियम\n"
            "• आपातकालीन हेल्पलाइन व विभाग विवरण\n"
            "• वार्ड समाधान समय सीमा (SLA)\n\n"
            "मैं आपकी किस प्रकार सहायता करूँ?"
        )
    else:
        return (
            "Hello! I am **CivicPulse AI**, your 24/7 On-Premise Smart City Municipal Assistant.\n\n"
            "I can help you with:\n"
            "• Tracking your complaint status (e.g., type \"Status of CIV-2026-8812\")\n"
            "• Step-by-step guidance on filing reports\n"
            "• Department contacts and emergency helplines\n"
            "• Information on ward coverage & resolution SLAs\n\n"
            "How can I assist you today?"
        )
