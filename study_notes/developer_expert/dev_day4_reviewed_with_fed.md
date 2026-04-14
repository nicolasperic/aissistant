# Day 4 — Git Patches & Composer File-level Modifications

## Table of Contents
- [1. Overview](#1-overview)
- [2. Creating and Applying Git Patches](#2-creating-and-applying-git-patches)
  - [2.1 git diff and .patch Files](#21-git-diff-and-patch-files)
  - [2.2 Applying Patches with git apply](#22-applying-patches-with-git-apply)
  - [2.3 git format-patch vs git diff](#23-git-format-patch-vs-git-diff)
- [3. Composer Patches — cweagans/composer-patches](#3-composer-patches--cweaganscomposer-patches)
  - [3.1 Installation and Setup](#31-installation-and-setup)
  - [3.2 The patches Key in composer.json](#32-the-patches-key-in-composerjson)
  - [3.3 Patch Application Order and Conflicts](#33-patch-application-order-and-conflicts)
  - [3.4 Patching Third-Party Packages](#34-patching-third-party-packages)
- [4. File-level Modifications via Composer](#4-file-level-modifications-via-composer)
  - [4.1 When Patching Is Not Possible](#41-when-patching-is-not-possible)
  - [4.2 Composer Scripts for File Manipulation](#42-composer-scripts-for-file-manipulation)
- [5. composer.lock — Why It Matters in Deployments](#5-composerlock--why-it-matters-in-deployments)
  - [5.1 What composer.lock Contains](#51-what-composerlock-contains)
  - [5.2 install vs update](#52-install-vs-update)
  - [5.3 Deployment Best Practices](#53-deployment-best-practices)
- [6. Quality Patches — magento/quality-patches](#6-quality-patches--magentoquality-patches)
  - [6.1 The quality-patches Tool](#61-the-quality-patches-tool)
  - [6.2 MDVA Patches](#62-mdva-patches)
  - [6.3 Applying and Reverting Quality Patches](#63-applying-and-reverting-quality-patches)
- [7. MDVA vs Custom Composer Patch — Key Comparison](#7-mdva-vs-custom-composer-patch--key-comparison)
- [8. Decision Flowchart](#8-decision-flowchart)
- [Quick-Reference Checklist](#quick-reference-checklist)

---

## 1. Overview

When working with Magento 2 (and PHP projects in general), you will frequently need to modify vendor code without forking a package. Two primary mechanisms exist:

| Mechanism | Use Case |
|---|---|
| **Git patches** | Raw diff files applied directly to source files |
| **Composer patches** | Automated patching of vendor packages at `composer install` |
| **Quality patches (MDVA)** | Adobe-supplied hotfixes for known Magento bugs |
| **File-level modifications** | Copying/overwriting files when a diff is impractical |

Understanding which tool to reach for — and why — is a **core exam topic**.

---

## 2. Creating and Applying Git Patches

### 2.1 git diff and .patch Files

A **patch file** is a text representation of a diff — the set of line-by-line changes between two states of one or more files. Git can produce patch files natively.

**Creating a patch from uncommitted working-directory changes:**

```bash
# Diff working tree against HEAD, save to a .patch file
git diff > my-fix.patch

# Diff a specific file only
git diff vendor/magento/module-catalog/Model/Product.php > product-fix.patch

# Diff between two commits
git diff abc1234 def5678 > between-commits.patch

# Diff a specific commit against its parent (single commit patch)
git diff HEAD~1 HEAD > last-commit.patch
```

**Anatomy of a .patch file:**

```diff
diff --git a/Model/Product.php b/Model/Product.php
index 3a7f21b..9c4e8d2 100644
--- a/Model/Product.php
+++ b/Model/Product.php
@@ -45,7 +45,7 @@ class Product extends \Magento\Catalog\Model\AbstractModel
      */
     public function getName()
     {
-        return $this->_getData('name');
+        return $this->_getData('name') ?? '';
     }
```

Key sections:
- `---` = original file (*a* version)
- `+++` = modified file (*b* version)
- `@@` = **hunk header** — line numbers and context
- `-` lines = removed
- `+` lines = added
- Unchanged context lines provide positioning anchors

> **Exam focus:** The hunk header format is `@@ -<original_start>,<count> +<new_start>,<count> @@`. Git uses *context lines* (usually 3) to locate where to apply changes. If the context does not match, the patch will fail.

### 2.2 Applying Patches with git apply

```bash
# Apply a patch file to the working tree
git apply my-fix.patch

# Dry run — check if patch applies cleanly without changing files
git apply --check my-fix.patch

# Apply with verbose output
git apply -v my-fix.patch

# Apply ignoring whitespace differences
git apply --ignore-whitespace my-fix.patch

# Apply with a path-strip level (strip N leading directory components)
git apply -p1 my-fix.patch   # default — strips one component (a/ or b/)
git apply -p0 my-fix.patch   # no stripping — paths must match exactly
```

**`-p` (prefix strip) explained:**

```
Patch path:   a/vendor/magento/module-catalog/Model/Product.php
-p0 looks for: a/vendor/magento/module-catalog/Model/Product.php
-p1 looks for:   vendor/magento/module-catalog/Model/Product.php  <-- default
-p2 looks for:          magento/module-catalog/Model/Product.php
```

> **Exam focus:** `-p1` is the default and strips the leading `a/` or `b/` prefix that `git diff` adds. Always verify the strip level matches the patch's path structure.

**Common failure scenarios:**

| Error | Cause | Fix |
|---|---|---|
| `error: patch failed` | Context lines don't match | Regenerate patch against correct version |
| `error: does not exist` | Wrong working directory or `-p` level | Adjust `-p` or `cd` to correct root |
| `already applied` | Patch was applied before | Check with `--check`; skip or reverse |

### 2.3 git format-patch vs git diff

```bash
# format-patch creates one .patch file per commit, includes commit metadata
git format-patch HEAD~3    # last 3 commits → 0001-*.patch, 0002-*.patch, 0003-*.patch

# Apply format-patch files (preserves commit message & author)
git am 0001-Fix-product-name-null.patch

# git diff produces a simple unified diff (no commit metadata)
git diff HEAD~1 > simple.patch
git apply simple.patch
```

| Feature | `git diff` + `git apply` | `git format-patch` + `git am` |
|---|---|---|
| Commit metadata preserved | No | Yes (author, date, message) |
| Multiple commits | Single file | One file per commit |
| Common use in Magento | ✅ Vendor patches | Code contributions/backports |

---

## 3. Composer Patches — cweagans/composer-patches

### 3.1 Installation and Setup

```bash
composer require cweagans/composer-patches
```

Enable patch application in `composer.json` by adding the `extra` configuration:

```json
{
    "extra": {
        "composer-exit-on-patch-failure": true,
        "patches": {}
    }
}
```

> **Exam focus:** Setting `"composer-exit-on-patch-failure": true` causes the build to **fail hard** if a patch cannot be applied. Without it, failures are only warnings — dangerous in production deployments.

The plugin hooks into Composer's **install** and **update** events. After packages are downloaded, it applies each registered patch file to the target package's directory inside `vendor/`.

### 3.2 The patches Key in composer.json

```json
{
    "require": {
        "magento/product-community-edition": "2.4.6",
        "cweagans/composer-patches": "~1.7"
    },
    "extra": {
        "composer-exit-on-patch-failure": true,
        "patches": {
            "magento/module-catalog": {
                "Fix null return in Product::getName()": "patches/ACME-1234-product-name-null.patch",
                "Fix category URL generation": "patches/ACME-5678-category-url.patch"
            },
            "magento/module-checkout": {
                "Fix shipping method display": "patches/ACME-9012-shipping-display.patch"
            }
        }
    }
}
```

**Structure breakdown:**

```
"patches": {
    "<vendor/package-name>": {           // Composer package that owns the file
        "<human-readable description>": "<relative/path/to/patch.patch>"
    }
}
```

> **Exam focus:** The package name under `patches` must be the **Composer package name** (as it appears in `vendor/<vendor>/<package>/composer.json`), **not** the Magento module name (e.g., `magento/module-catalog`, not `Magento_Catalog`).

**External URL patches** are also supported:

```json
"magento/module-catalog": {
    "Remote hotfix from GitHub": "https://raw.githubusercontent.com/example/repo/main/fix.patch"
}
```

**Patches from a separate file** (keeping `composer.json` clean):

```json
{
    "extra": {
        "patches-file": "patches/composer.patches.json"
    }
}
```

`patches/composer.patches.json`:
```json
{
    "patches": {
        "magento/module-catalog": {
            "Fix product name": "patches/ACME-1234.patch"
        }
    }
}
```

### 3.3 Patch Application Order and Conflicts

**Order within a package:** Patches are applied in the **order they appear** in the `patches` object for that package. This is significant when patches modify the same file.

```json
"magento/module-catalog": {
    "Step 1 — base fix": "patches/step1.patch",
    "Step 2 — extension of step 1": "patches/step2.patch"
}
```

If `step2.patch` was generated against the already-patched file from `step1.patch`, the order **must** be preserved.

> **Exam focus:** Composer object key order in JSON is **not guaranteed** by the JSON spec, but `cweagans/composer-patches` reads them sequentially as parsed by PHP's `json_decode`. In practice, maintain order carefully and test.

**Conflict detection:**

```bash
# Dry-run to test patch application
composer install --dry-run

# Verbose output shows patch application attempts
composer install -v

# Force re-application of all patches (after composer install already ran)
composer install --no-cache
```

When a patch conflicts:
1. Check if the target package version has changed (e.g., after `composer update`)
2. Regenerate the patch against the new package version
3. Check if the issue was already fixed upstream (making the patch unnecessary)

### 3.4 Patching Third-Party Packages

The same mechanism works for **any** Composer package:

```json
"extra": {
    "patches": {
        "symfony/http-foundation": {
            "Backport session fix": "patches/symfony-session-fix.patch"
        },
        "league/flysystem": {
            "Add custom adapter support": "patches/flysystem-adapter.patch"
        }
    }
}
```

**Creating a patch for a vendor package:**

```bash
# Navigate to the package directory
cd vendor/magento/module-catalog

# Make your changes to a file
nano Model/Product.php

# From the Magento project root, generate the patch
git diff vendor/magento/module-catalog/Model/Product.php > patches/ACME-1234-product-name-null.patch
```

---

## 4. File-level Modifications via Composer

### 4.1 When Patching Is Not Possible

Patching fails or is impractical when:

- The target file is **binary** (images, compiled assets, SQLite databases)
- The file was added in the new version and does not exist in your base — no diff context
- The patch would be **larger than the file itself** (wholesale replacement)
- The vendor file has **no line-level structure** suitable for diff (minified JS)
- You need to **add a new file** to a vendor package (no source to diff against)
- Complex merge conflicts make a clean patch impossible to maintain

**Strategies for file-level modification:**

| Strategy | Mechanism | Best For |
|---|---|---|
| Composer scripts | `post-install-cmd`, `post-update-cmd` | Copy/replace files after install |
| `wikimedia/composer-merge-plugin` | Merges multiple `composer.json` fragments | Modular config management |
| Magento `di.xml` plugin system | PHP class interception | Behaviour changes (preferred over patching PHP) |
| Theme override | `app/design` directory | Frontend template/layout changes |

> **Exam focus:** For Magento, the **correct** architectural solution before reaching for a file-level patch is usually a **Plugin (Interceptor)**, **Preference**, or **Theme Override**. Patching should be a last resort for vendor PHP files.

### 4.2 Composer Scripts for File Manipulation

```json
{
    "scripts": {
        "post-install-cmd": [
            "@php -r \"copy('patches/files/custom-robots.txt', 'vendor/magento/module-sitemap/etc/robots.txt');\"",
            "bash scripts/apply-file-overrides.sh"
        ],
        "post-update-cmd": [
            "@post-install-cmd"
        ]
    }
}
```

A dedicated shell script approach:

```bash
#!/bin/bash
# scripts/apply-file-overrides.sh

echo "Applying file-level overrides..."

# Replace a template file
cp -f patches/files/vendor-template.phtml \
      vendor/magento/module-catalog/view/frontend/templates/product/view.phtml

# Replace a JS file
cp -f patches/files/custom-widget.js \
      vendor/magento/module-ui/view/base/web/js/lib/mage/utils/template.js

echo "File overrides applied."
```

> **Exam focus:** File-level overrides via scripts are **fragile** — they break silently when the vendor package is updated, because `composer update` replaces the vendor directory and then the script re-applies the override. Always document why each override exists and what version it was created against.

---

## 5. composer.lock — Why It Matters in Deployments

### 5.1 What composer.lock Contains

`composer.lock` is a **snapshot** of the exact resolved dependency tree at the time `composer install` or `composer update` was last run.

For each package it records:

```json
{
    "name": "magento/module-catalog",
    "version": "103.0.6",
    "source": {
        "type": "git",
        "url": "https://github.com/magento/magento2.git",
        "reference": "a3f7c21b9d4e8f1234567890abcdef1234567890"
    },
    "dist": {
        "type": "zip",
        "url": "https://api.github.com/repos/magento/magento2/zipball/a3f7c21b...",
        "reference": "a3f7c21b9d4e8f1234567890abcdef1234567890",
        "shasum": ""
    },
    "require": { ... },
    "autoload": { ... }
}
```

**Key fields:**
- `version` — the exact version string
- `reference` — the exact **git commit hash** (for VCS sources) or dist URL
- `require`/`require-dev` — resolved dependencies of *that* package

### 5.2 install vs update

```bash
# Uses composer.lock — installs EXACTLY the locked versions
# Safe for deployment
composer install

# Ignores composer.lock — resolves newest versions matching composer.json constraints
# NEVER run on production
composer update

# Update a single package only (safer than full update)
composer update magento/module-catalog

# Regenerate composer.lock without updating packages (after manual composer.json edit)
composer update --lock
```

> **Exam focus:** `composer install` reads `composer.lock` and installs exact versions. `composer update` reads `composer.json` constraints and may pull in **newer versions** that were not tested. **Always commit `composer.lock` to your VCS** and deploy with `composer install`.

### 5.3 Deployment Best Practices

```
Developer workstation                  CI/CD Pipeline               Production
---------------------                  ----------------             ----------
1. Edit composer.json         -->  3. git pull                 --> 5. git pull
2. Run composer update        -->  4. composer install --no-dev --> 6. composer install --no-dev
   (resolves + locks)              (reads composer.lock)            (reads composer.lock)
   commit composer.lock
```

**Production-safe install flags:**

```bash
# No dev dependencies, optimised autoloader, no interaction
composer install \
    --no-dev \
    --optimize-autoloader \
    --no-interaction \
    --prefer-dist
```

**Patches and composer.lock interaction:**

- `cweagans/composer-patches` records applied patches in `composer.lock` under the package's `extra` data
- If you add a new patch to `composer.json` without running `composer install`, the lock file becomes **out of sync**
- Run `composer install` (not `update`) to apply new patches without changing package versions

> **Exam focus:** Adding a patch to `composer.json` and committing only `composer.json` (not the updated `composer.lock`) means the patch is **not guaranteed to be applied** on the next `composer install` from an already-up-to-date lock. Always commit both files together.

---

## 6. Quality Patches — magento/quality-patches

### 6.1 The quality-patches Tool

Adobe provides an official tool for discovering and applying **pre-built hotfixes** for known Magento issues:

```bash
# Install the tool
composer require magento/quality-patches

# List all available patches for your Magento version
./vendor/bin/magento-patches status

# Apply a specific patch
./vendor/bin/magento-patches apply MDVA-12345

# Apply multiple patches
./vendor/bin/magento-patches apply MDVA-12345 MDVA-67890

# Revert a patch
./vendor/bin/magento-patches revert MDVA-12345

# Check current status (applied/not applied)
./vendor/bin/magento-patches status | grep MDVA-12345
```

**Status output example:**

```
+----------+---------+----------+------------------------------------------------------------------+
| Id       | Type    | Status   | Description                                                      |
+----------+---------+----------+------------------------------------------------------------------+
| MDVA-30106 | Optional | Applied | Fix for checkout payments not loading issue                     |
| MDVA-35197 | Optional | N/A     | GraphQL: issue when adding product to cart with added options   |
| ACSD-51471 | Optional | Applied | Fix for simple product configurable with scheduled update       |
+----------+---------+----------+------------------------------------------------------------------+
```

> **Exam focus:** `./vendor/bin/magento-patches status` shows **all available** patches with their application status for your specific Magento version. The tool is version-aware — it only shows patches applicable to your installed version.

### 6.2 MDVA Patches

**MDVA** stands for **Magento Development Verified by Adobe** (sometimes described as *Magento DVA*). These are official hotfixes released by Adobe between regular Magento releases.

**Naming convention:**

```
MDVA-NNNNN     — Legacy naming (Magento 2.3.x era, still in use for older fixes)
ACSD-NNNNN     — Newer naming convention (Adobe Commerce Support Delivery)
MC-NNNNN       — Magento Commerce internal ticket reference
```

**MDVA patch characteristics:**

- Produced by Adobe engineering for bugs that cannot wait for the next minor/patch release
- Each patch targets a **specific range of Magento versions** (e.g., `>=2.4.0 <2.4.4`)
- Applied via the `magento/quality-patches` CLI tool
- Tracked in `magento/quality-patches` package's `patches.json` manifest
- Should be **removed** from your patches list once the fix is included in a Magento release

**Finding patches for a known issue:**

```bash
# Search by bug description keyword
./vendor/bin/magento-patches status | grep -i "checkout"

# Full list with version compatibility (use python3 on modern systems)
./vendor/bin/magento-patches status --format=json | python3 -m json.tool
```

**Adobe Commerce Cloud — .magento.env.yaml integration:**

For Adobe Commerce Cloud projects, quality patches are configured in `.magento.env.yaml`:

```yaml
stage:
  build:
    QUALITY_PATCHES:
      - MDVA-30106
      - ACSD-51471
      - MDVA-35197
```

> **Exam focus:** On Adobe Commerce Cloud, quality patches are listed in `.magento.env.yaml` under `QUALITY_PATCHES`, **not** in `composer.json`. This is a critical distinction for Cloud deployments.

### 6.3 Applying and Reverting Quality Patches

```bash
# Apply all patches listed in .magento.env.yaml (Cloud environment only)
# Happens automatically during cloud build phase

# On-premises / non-cloud: apply via CLI
./vendor/bin/magento-patches apply MDVA-30106

# Verify a patch was applied
./vendor/bin/magento-patches status | grep MDVA-30106

# Revert
./vendor/bin/magento-patches revert MDVA-30106

# List only applied patches
./vendor/bin/magento-patches status | grep "Applied"
```

**Patch storage location after apply:**

Quality patches are stored in:
```
vendor/magento/quality-patches/patches/
```

They are applied to files inside `vendor/` just like `cweagans/composer-patches`, but managed by the separate `magento-patches` CLI rather than Composer's install hooks.

---

## 7. MDVA vs Custom Composer Patch — Key Comparison

This is the **core exam differentiator** for this topic.

| Dimension | MDVA / Quality Patch | Custom Composer Patch |
|---|---|---|
| **Source** | Adobe/Magento engineering team | Your development team |
| **Purpose** | Fix a known, confirmed Magento bug | Custom business logic change or third-party fix |
| **Tool** | `magento/quality-patches` CLI | `cweagans/composer-patches` + `composer.json` |
| **Storage (Cloud)** | `.magento.env.yaml` → `QUALITY_PATCHES` | `composer.json` → `extra.patches` |
| **Storage (on-prem)** | Applied via `magento-patches apply` CLI | Declared in `composer.json`, applied on `composer install` |
| **Lifecycle** | Temporary — remove when fixed version released | Permanent until you refactor or upstream accepts change |
| **Versioning** | Versioned by Adobe, compatibility matrix in tool | You own versioning and compatibility |
| **Risk** | Low — Adobe-tested against specific version range | Medium — must maintain as packages update |
| **Discoverability** | `magento-patches status` lists all available | Only what you've added to `composer.json` |
| **Appropriate when** | A known Adobe bug affects your project | Core/vendor code needs custom modification |

**Decision rules:**

```
Is this a known Magento bug with an Adobe issue number?
  YES --> Does magento/quality-patches have an MDVA/ACSD for it?
            YES --> Apply quality patch via magento-patches tool
            NO  --> Create custom composer patch (interim) + file Adobe ticket
  NO  --> Is it a business-logic change to vendor code?
            YES --> Can it be solved with di.xml plugin/preference?
                      YES --> Use plugin system (PREFERRED)
                      NO  --> Create custom composer patch
            NO  --> Is it a third-party package bug?
                      YES --> Create custom composer patch + file upstream issue
```

> **Exam focus:** If a question describes a **known Magento bug with an MDVA number**, the answer is always the `magento/quality-patches` tool, not a custom patch in `composer.json`. If the question describes a **custom business requirement** or **third-party bug**, it is a custom composer patch.

---

## 8. Decision Flowchart

```
Need to modify vendor code?
         |
         v
Is it a Magento core bug?
    |           |
   YES          NO
    |           |
    v           v
Check quality-patches    Is a Magento Plugin/Preference possible?
status for MDVA/ACSD           |             |
    |                         YES            NO
    |                          |             |
MDVA exists?          Use di.xml plugin   Is file binary or
    |    |            (PREFERRED)         non-patchable?
   YES   NO                                  |      |
    |    |                                  YES     NO
    v    v                                   |      |
Apply    Create              File-level   Create
quality  custom              override     .patch file
patch    composer            via          + add to
via      patch               composer     composer.json
CLI      (interim)           script       patches key
```

---

## Quick-Reference Checklist

### Git Patches
- [ ] `git diff > file.patch` creates a unified diff patch file
- [ ] `git diff <file>` creates a patch for a single file
- [ ] `git apply file.patch` applies a patch to the working tree
- [ ] `git apply --check file.patch` does a dry run without changing files
- [ ] `-p1` is the default strip level — removes leading `a/` or `b/` from paths
- [ ] `-p0` applies with no path stripping (paths must match exactly)
- [ ] `--ignore-whitespace` bypasses whitespace-only mismatches
- [ ] `git format-patch` preserves commit metadata; `git diff` does not
- [ ] `git am` applies `format-patch` files (with commit metadata)
- [ ] Context lines in a patch must match the target file for application to succeed

### Composer Patches (cweagans/composer-patches)
- [ ] Package name in `patches` key is the **Composer package name** (e.g., `magento/module-catalog`)
- [ ] `"composer-exit-on-patch-failure": true` causes hard failure if a patch fails to apply
- [ ] Patches are applied in the order declared within each package key
- [ ] Patch files are applied relative to the project root path
- [ ] `patches-file` config key offloads patches list to a separate JSON file
- [ ] External URLs are supported as patch sources
- [ ] Patches are re-applied on every `composer install` to vendor directories
- [ ] Both `composer.json` and `composer.lock` must be committed when adding patches

### File-level Modifications
- [ ] Use when target file is binary, minified, or wholesale replacement is needed
- [ ] Implemented via `post-install-cmd` and `post-update-cmd` Composer scripts
- [ ] File overrides are fragile — broken silently on `composer update`
- [ ] Magento Plugin/Preference system is preferred over patching PHP files
- [ ] Theme overrides in `app/design` are preferred over patching frontend files

### composer.lock
- [ ] `composer install` reads `composer.lock` — reproducible, safe for deployment
- [ ] `composer update` ignores lock, resolves newest matching versions — **never on production**
- [ ] `composer.lock` contains exact version + git reference (commit hash) for each package
- [ ] Always commit `composer.lock` to version control
- [ ] Deploy with `--no-dev --optimize-autoloader --prefer-dist`
- [ ] Adding a patch without updating `composer.lock` leaves deployment out of sync

### Quality Patches / MDVA
- [ ] Tool: `composer require magento/quality-patches`
- [ ] CLI: `./vendor/bin/magento-patches status` lists available patches for your version
- [ ] CLI: `./vendor/bin/magento-patches apply MDVA-NNNNN` applies a specific patch
- [ ] CLI: `./vendor/bin/magento-patches revert MDVA-NNNNN` reverts a patch
- [ ] MDVA = Magento Development Verified by Adobe (legacy naming)
- [ ] ACSD = Adobe Commerce Support Delivery (newer naming)
- [ ] On Cloud: patches declared in `.magento.env.yaml` → `QUALITY_PATCHES` array
- [ ] MDVA patches are **temporary** — remove when fix is included in a release
- [ ] Quality patches are version-aware — only applicable patches are shown for your version

### Key Exam Differentiators
- [ ] **Known Magento bug + MDVA number** → use `magento/quality-patches` tool
- [ ] **Custom business requirement or third-party bug** → use `cweagans/composer-patches`
- [ ] **Magento core behaviour change** → prefer `di.xml` plugin/preference over any patch
- [ ] **Cloud deployment** → quality patches go in `.magento.env.yaml`, NOT `composer.json`
- [ ] **On-premises deployment** → quality patches applied via `magento-patches` CLI
- [ ] MDVA patches are maintained by Adobe; custom patches are maintained by your team
- [ ] `composer install` ≠ `composer update` — know the exact difference for deployment scenarios
