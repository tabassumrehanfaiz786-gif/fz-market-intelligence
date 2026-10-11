<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep market visualization in a dedicated browser-safe canvas component, separate from the page controls; this keeps drawing and interaction isolated.
- Until a verified market feed is connected, render deterministic simulation data with explicit simulation labels; this prevents sample observations being mistaken for live or historical evidence.
- Use a shared terminal shell with separate file-based routes for research modules; this keeps navigation consistent without crowding the dashboard.
- Keep reproducible research fixtures and pure calculations separate from real Cloud observation tables; this prevents demo evidence contaminating recorded market data.
- Use authenticated server functions and owner-scoped RLS for personal case files and separate protected role rows for privileges; this enforces data isolation independently of UI visibility.
