# ETH_Oxford_2026

## Introduction

Aircraft condensation trails (contrails) contribute a substantial fraction of aviation’s overall climate impact, often exceeding that of CO₂ on relevant timescales. Importantly, contrail formation and its resulting energy forcing (EF) depend sensitively on local atmospheric conditions and can therefore be mitigated through intelligent flight planning that avoids contrail-prone regions.

Existing contrail-avoidance research has largely relied on the *polygon method*, in which airspace is sorted into “contrail-forming” and “non-contrail-forming” regions. While computationally convenient, this binary classification fails to capture the inherently continuous nature of contrail energy forcing: the climate impact of a contrail varies smoothly with atmospheric state rather than switching on or off at a fixed boundary.

Our project directly addresses this limitation by modelling contrail impact as a **continuous energy-forcing penalty field** over airspace. Instead of avoiding hard-coded polygons, we assign each region a real-valued EF penalty and compute optimal flight trajectories by minimising a combined objective:

Total cost = fuel burn + λ · EF_contrail

where λ controls the trade-off between operational efficiency and climate impact. By optimising over the entire route, our approach enables smooth, physically grounded trade-offs between fuel cost and contrail mitigation, yielding routes that are both operationally realistic and climate-aware.
