---
tags: vim
---

    :g/{/ .+1,/}/-1 sort

Explanation:

-   `:g/{/`: for all lines matching the pattern `{`
-   `.+1`: start at the next line (`.` is the line)
-   `,`: and continue until
-   `/}/`: the next line matching the pattern `}`
-   `-1`: but, specifically, the line before that
-   `sort`: sort everything in that range

Alternatively, make a binding to do this wherever the cursor is:

    noremap <silent> <leader>s ?{?+1;/}/-1sort i<CR>

-   `?{?`: search back to line with `{`
-   `+1`: next line
-   `,`: then go until (`;` would also work)
-   `/}/`: next line with `}`
-   `-1`: get previous line
-   `sort`: sort within the range
-   `i`: case-insensitively
