# Hand-held dynamometer strength norms

A static site that compares isometric hand-held dynamometer (HHD) readings with published healthy-adult (and lifespan) reference values, by **sex**, **age**, **limb side**, and **body weight**.

Open [the live page](https://parautilitarian.github.io/dynamometer-readings/) or open `index.html` locally. Nothing is uploaded; readings stay in the browser (`localStorage`).

## What “normal” means here

There is no single universal HHD normal. Values depend on the dynamometer, the tester’s ability to hold a **make** test, and the exact joint position. This tool uses the studies that reported the most complete age × sex tables for the muscle actions clinicians actually measure:

| Dataset | Ages | What it covers | How strength is expressed |
| --- | --- | --- | --- |
| [Bohannon 1997](https://pubmed.ncbi.nlm.nih.gov/9014953/) | 20–79 | Wrist ext, elbow flex/ext, shoulder ext/abd/ER, hip flex/abd, knee ext, ankle DF | **% of body weight**, by sex × decade × side, plus a regression on sex, age, and weight |
| [Andrews, Thomas & Bohannon 1996](https://doi.org/10.1093/ptj/76.3.248) | 50–79 | Adds shoulder flex & IR and knee flex (and repeats the 1997 actions) | **% of body weight**, same layout, plus regression |
| [McKay et al. 2017, 1000 Norms Project](https://pmc.ncbi.nlm.nih.gov/articles/PMC5200854/) | 3–101 | Grip, ankle DF/PF, hip ABD/IR/ER, elbow flex/ext, shoulder IR/ER (dominant limb) | Absolute **Newtons** (not weight-normalised) |
| [Dodds et al. 2014](https://doi.org/10.1371/journal.pone.0113637) | 5–90 | Hand grip (Jamar-style) | **kg**, centiles and mean (SD) by sex and age |

A reading more than **2 SD below** the matched mean is flagged as weak (the cutoff Andrews & Bohannon used). ±1 SD is treated as typical.

Typical adult % body-weight means (dominant side, men 20–29, Bohannon 1997) give a sense of scale: knee extension ~74%, ankle dorsiflexion ~49%, shoulder extension ~50%, hip abduction ~40%, elbow flexion ~36%, shoulder abduction ~33%, hip flexion ~27%, shoulder ER ~26%, wrist extension ~23%. Women of the same age are lower in most upper-limb actions but similar or higher for knee extension as a fraction of body weight.

## How to use it

1. Enter sex, age, body weight, dominant side, and the unit your dynamometer displays (N, kgf, or lbf).
2. Enter peak isometric force for each action you tested. Leave blanks for untested muscles.
3. The body map colours each muscle and the table reports % body weight, z-score, percentile, and % of the regression-predicted force when an equation exists.

Use the same **gravity-neutralised make-test positions** listed on the page. Plantarflexion and young-male knee extension are hard for a tester to resist; those norms under-estimate true strength.

## Run locally

No build step. Serve the folder (GitHub Pages, or `python3 -m http.server`) and open `/`.

## Not medical advice

Reference samples were convenience samples of healthy volunteers. Device, country, and tester strength all move the numbers. Treat the ratings as a guide, not a diagnosis.
