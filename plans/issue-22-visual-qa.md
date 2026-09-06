1. **HeaderBar NavBar pill buttons (`frontend/src/components/HeaderBar/HeaderBar.tsx`)**  
   - **Current:** The component renders an outline pill with label `vendors` followed by a single solid pill with label `sign up`.  
   - **Target (Figma):** Two solid pills, both with label `sign up`, placed adjacent to each other in the NavBar actions area.  
   - **Correction:** Remove the `vendors` outline pill button and instantiate a second solid `sign up` pill button in its place. If the horizontal spacing between the two pills differs from the current layout, update `frontend/src/components/HeaderBar/HeaderBar.css` to adjust the `gap` property on the NavBar actions container to match the Figma auto-layout spacing.

2. **Leaderboards responsive grid (`frontend/src/components/Leaderboards/Leaderboards.css`)**  
   - No changes required. The existing CSS Grid declarations (`grid-template-columns: 1fr` for 390px, `repeat(2, 1fr)` for 744px, and `repeat(3, 1fr)` for 1440px) already reproduce the Figma layout. The component instance swaps and grid reordering produce no visible spacing, typography, or color differences.

3. **LeaderboardCard component**  
   - No changes required. `frontend/src/components/LeaderboardCard/LeaderboardCard.tsx` and `frontend/src/components/LeaderboardCard/LeaderboardCard.css` already match the Figma instance structure and styling. No spacing, typography, or color corrections are needed.