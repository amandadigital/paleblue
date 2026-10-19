import re

NON_COSMIC_PATTERNS = [
    # Earth
    r"\bearth\b", r"\bearth[\'s]*\b", r"\bblue marble\b", r"\bearthrise\b", r"\bterrestrial\b",
    r"\bglobe\b", r"\bcontinent\b", r"\bocean\b", r"\bhurricane\b", r"\bcyclone\b", r"\bweather\b",
    r"\biss\b", r"\binternational space station\b", r"\blow earth orbit\b", r"\borbiting earth\b",
    # Labs & Facilities
    r"\blab\b", r"\blaboratory\b", r"\bcleanroom\b", r"\bclean room\b", r"\bfacility\b",
    r"\bhangar\b", r"\bbuilding\b", r"\bauditorium\b", r"\btest stand\b", r"\bvacuum chamber\b",
    r"\bheadquarters\b", r"\bcenter\b", r"\bgoddard\b", r"\bjpl\b", r"\bkennedy\b",
    # People & Events
    r"\bperson\b", r"\bpeople\b", r"\bengineer\b", r"\bscientist\b", r"\btechnician\b",
    r"\bastronaut\b", r"\bcrew\b", r"\badministrator\b", r"\bdirector\b", r"\bpress\b",
    r"\bconference\b", r"\bcelebration\b", r"\bceremony\b", r"\baward\b", r"\bmeeting\b",
    r"\bspeech\b", r"\bsymposium\b", r"\bbriefing\b", r"\bportrait\b", r"\bvisitor\b",
    r"\bstudent\b", r"\bchildren\b", r"\bexhibit\b", r"\bmuseum\b", r"\bpennsylvania\b",
    # Rockets & Hardware
    r"\brocket\b", r"\blaunch\b", r"\blauncher\b", r"\bpad\b", r"\bpad 39\b", r"\bsls\b",
    r"\bbooster\b", r"\bcrawler\b", r"\bfalcon\b", r"\batlas\b", r"\bdelta\b", r"\bvab\b",
    r"\bfairing\b", r"\bengine test\b", r"\bstatic fire\b", r"\bliftoff\b", r"\brollout\b",
    r"\bgantry\b", r"\btransporter\b", r"\bwheel\b", r"\bchassis\b", r"\bparachute\b",
    r"\bheat shield\b",
    # Diagrams & Art
    r"\bdiagram\b", r"\bschematic\b", r"\bchart\b", r"\bgraph\b", r"\binfographic\b",
    r"\blogo\b", r"\bposter\b", r"\bpatch\b", r"\binsignia\b", r"\bconcept\b",
    r"\billustration\b", r"\bdrawing\b", r"\bartist[\'s]* impression\b"
]

def is_non_cosmic(title, keywords):
    text = (title + " " + " ".join(keywords)).lower()
    for pattern in NON_COSMIC_PATTERNS:
        if re.search(pattern, text):
            return True, pattern
    return False, None

test_cases = [
    ("Hubble reveals the Ring Nebula's true shape", ["Ring Nebula", "Hubble"]),
    ("Hubble reveals heart of Lagoon Nebula", ["Lagoon Nebula", "M8"]),
    ("Mars Celebration", ["Mars", "Mars Celebration", "Pennsylvania"]),
    ("Astronaut in Cleanroom", ["JPL", "cleanroom", "engineer"]),
    ("Earth from Space", ["Earth", "orbit", "ISS"]),
    ("SLS Rocket Rollout to Launch Pad 39B", ["Artemis", "Rocket", "SLS", "Launch"]),
    ("Diagram of Exoplanet Atmosphere", ["Exoplanet", "Diagram", "Chart"]),
    ("Cassini Approaching Saturn", ["Saturn", "Cassini", "Planet"]),
    ("Pillars of Creation in M16", ["Eagle Nebula", "Pillars of Creation", "Hubble"]),
    ("Blue Marble 2012", ["Earth", "Blue Marble", "Suomi NPP"]),
]

for title, kw in test_cases:
    bad, pat = is_non_cosmic(title, kw)
    status = "REJECTED (" + pat + ")" if bad else "ACCEPTED (COSMOS)"
    print(f"{title:45} -> {status}")
