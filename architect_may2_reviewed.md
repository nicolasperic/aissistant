# PHP Certification Exam — Full Simulation Study Notes
## Final Review & Gap Analysis Master Reference

> **Purpose:** These notes serve as your complete final-review companion for Exam Simulation #4. Use them *before* the simulation to consolidate knowledge, and *after* to cross-reference every error against the exact section below.

---

## Table of Contents

1. [How to Use These Notes](#1-how-to-use-these-notes)
2. [Exam Structure & Scoring Strategy](#2-exam-structure--scoring-strategy)
3. [Section A — PHP Language Core](#3-section-a--php-language-core)
   - [3.1 Types, Casting & Juggling](#31-types-casting--juggling)
   - [3.2 Operators & Precedence](#32-operators--precedence)
   - [3.3 Control Flow & Match Expressions](#33-control-flow--match-expressions)
   - [3.4 Functions — Parameters, Scope & First-Class Callables](#34-functions--parameters-scope--first-class-callables)
   - [3.5 Arrays — Manipulation & Iteration](#35-arrays--manipulation--iteration)
   - [3.6 Strings & Regex](#36-strings--regex)
   - [3.7 OOP — Classes, Interfaces, Traits & Enums](#37-oop--classes-interfaces-traits--enums)
   - [3.8 Error Handling & Exceptions](#38-error-handling--exceptions)
   - [3.9 Fibers & Generators](#39-fibers--generators)
4. [Section B — Extended Engine (EE) Features](#4-section-b--extended-engine-ee-features)
   - [4.1 Type System Enhancements (PHP 8.x)](#41-type-system-enhancements-php-8x)
   - [4.2 Named Arguments & Attributes](#42-named-arguments--attributes)
   - [4.3 Constructor Promotion & Readonly](#43-constructor-promotion--readonly)
   - [4.4 JIT Compilation](#44-jit-compilation)
   - [4.5 Match, Nullsafe & Spread Operator](#45-match-nullsafe--spread-operator)
   - [4.6 String Functions & Multibyte](#46-string-functions--multibyte)
   - [4.7 Date/Time & Intl Extension](#47-datetime--intl-extension)
5. [Section C — Web & Cloud Configuration](#5-section-c--web--cloud-configuration)
   - [5.1 php.ini Directives — Complete Reference](#51-phpini-directives--complete-reference)
   - [5.2 Apache & Nginx Integration](#52-apache--nginx-integration)
   - [5.3 Sessions & Cookies](#53-sessions--cookies)
   - [5.4 Output Buffering & Headers](#54-output-buffering--headers)
   - [5.5 File Uploads & Streams](#55-file-uploads--streams)
   - [5.6 Security — Filters, Sanitisation & CSP](#56-security--filters-sanitisation--csp)
   - [5.7 Cloud Config & Environment Variables](#57-cloud-config--environment-variables)
6. [Section D — Plugin / Extension Order & Interactions](#6-section-d--plugin--extension-order--interactions)
   - [6.1 Extension Loading Order](#61-extension-loading-order)
   - [6.2 Composer Autoloading & PSR Standards](#62-composer-autoloading--psr-standards)
   - [6.3 OPcache Configuration](#63-opcache-configuration)
   - [6.4 Xdebug & Profiling Extensions](#64-xdebug--profiling-extensions)
7. [High-Frequency Traps & Common Wrong Answers](#7-high-frequency-traps--common-wrong-answers)
8. [Error Pattern Diagnostic Matrix](#8-error-pattern-diagnostic-matrix)
9. [Quick-Reference Checklist](#9-quick-reference-checklist)

---

## 1. How to Use These Notes

```
BEFORE simulation  -->  Read Sections 3–6 fully, skim Quick-Reference Checklist
DURING simulation  -->  Close everything. Real conditions only.
AFTER simulation   -->  Score by section, open Error Pattern Diagnostic Matrix (Section 8)
                        Map every wrong answer to a section number
                        The section with the most hits = priority for next 3 days
```

**Simulation Protocol Checklist:**

- [ ] Quiet room, phone in another room
- [ ] Timer: **110 minutes** for 60 questions (~1 min 50 sec per question)
- [ ] No browser, no notes, no IDE
- [ ] Paper and pen only (scratch work)
- [ ] Score immediately after — do NOT review answers during the test
- [ ] Log each wrong answer: question number + topic tag

---

## 2. Exam Structure & Scoring Strategy

### Score Targets

| Section | Questions (approx.) | Passing | Confidence |
|---|---|---|---|
| PHP Language Core | ~25 | ≥70% (18/25) | ≥75% (19/25) |
| EE Features | ~20 | ≥70% (14/20) | ≥75% (15/20) |
| Web & Cloud Config | ~15 | ≥70% (11/15) | ≥75% (12/15) |

**Overall:** 60 questions → pass = 42 correct, confidence = 45 correct

### Time Management Strategy

```
0:00 - 0:80   First pass — answer what you know immediately (target: 45+ questions)
0:80 - 1:05   Second pass — tackle flagged questions
1:05 - 1:10   Final review — verify any "gut feeling" changes (only change if certain)
```

**Exam focus:** The exam rewards time management. Never spend more than 3 minutes on any single question on first pass — flag it and move on.

### Priority Ranking Protocol (Post-Exam)

```
After scoring:

  Score Section A = X%
  Score Section B = Y%
  Score Section C = Z%

  Rank lowest to highest:
  Priority 1 (lowest %) = 3 days intensive review
  Priority 2            = 1 day targeted review
  Priority 3 (highest%) = 1 hour quick refresh only
```

---

## 3. Section A — PHP Language Core

### 3.1 Types, Casting & Juggling

PHP has **10 primitive types**: `bool`, `int`, `float`, `string`, `array`, `object`, `callable`, `iterable`, `null`, `never` (PHP 8.1+).

#### Type Juggling Rules — The Dangerous Cases

```php
<?php

// Loose comparisons (==) — THE MOST TESTED AREA
var_dump(0 == "foo");      // PHP 8: false (changed from PHP 7 true!)
var_dump(0 == "");         // PHP 8: false (changed from PHP 7 true!)
var_dump(0 == "0");        // true (string "0" is numeric)
var_dump(0 == null);       // true
var_dump("" == null);      // true
var_dump("0" == false);    // true
var_dump("0" == null);     // false
var_dump(100 == "1e2");    // true (scientific notation!)
var_dump("1" == "01");     // true (both numeric strings)
var_dump("10" == "1e1");   // true
```

**Exam focus:** PHP 8 changed `0 == "non-numeric-string"` from `true` to `false`. This is the single most-tested type juggling change for PHP 8 certification.

#### Explicit Casting

```php
<?php

// Casting operators
(int)    "42abc"    // => 42
(int)    "abc"      // => 0
(int)    true       // => 1
(int)    false      // => 0
(int)    null       // => 0
(int)    1.9        // => 1  (truncates, does NOT round)
(int)    -1.9       // => -1 (truncates toward zero)
(bool)   ""         // => false
(bool)   "0"        // => false  (THE only non-empty string that is false!)
(bool)   "false"    // => true   (non-empty, non-"0" string)
(bool)   []         // => false
(bool)   [0]        // => true
(bool)   0.0        // => false
(bool)   -0.0       // => false
(float)  "1.5e3"    // => 1500.0
(array)  null       // => []
(array)  42         // => [42]
(array)  "hello"    // => ["hello"]
```

**Exam focus:** `(bool)"0"` is `false` — this catches nearly everyone. Also: `(int)1.9 === 1`, NOT 2.

#### `settype()` vs Casting

```php
<?php

$var = "42";
settype($var, "integer");  // modifies in place, returns bool
echo $var;                 // 42 (int)

// vs
$var = "42";
$cast = (int) $var;        // original unchanged
```

### 3.2 Operators & Precedence

#### Precedence Table (High → Low, Exam-Critical Subset)

| Precedence | Operator(s) | Associativity |
|---|---|---|
| Highest | `clone`, `new` | n/a |
| | `**` (power) | right |
| | `++`, `--` (pre/post), `~`, `(int)`, `(string)` etc., `@` | right |
| | `instanceof` | left |
| | `!` | right |
| | `*`, `/`, `%` | left |
| | `+`, `-`, `.` | left |
| | `<<`, `>>` | left |
| | `<`, `<=`, `>`, `>=` | left |
| | `==`, `!=`, `===`, `!==`, `<=>` | left |
| | `&` | left |
| | `^` | left |
| | `\|` | left |
| | `&&` | left |
| | `\|\|` | left |
| | `??` (null coalesce) | right |
| | `? :` (ternary) | left (non-assoc in 8.0+) |
| | `=`, `+=`, `-=`, `??=` etc. | right |
| | `yield from`, `yield` | right |
| Lowest | `print` | right |
| | `and` | left |
| | `xor` | left |
| | `or` | left |

**Exam focus:** `and`/`or` have **lower** precedence than `=`. This is a trap:

```php
<?php

$a = true and false;   // $a === true  (assignment happens first!)
$a = (true and false); // $a === false (parentheses override)

$b = true || false;    // $b === true  (|| higher precedence than =... wait:)
// Actually = has lower precedence than ||, so:
// $b = (true || false) => $b = true. Correct.

$c = false || true;    // $c === true
$d = false or true;    // $d === false  (= binds before 'or')
```

#### Spaceship Operator `<=>`

```php
<?php

echo 1 <=> 2;    // -1
echo 2 <=> 1;    //  1
echo 1 <=> 1;    //  0
echo "b" <=> "a"; // 1

// Primary use: usort callbacks
usort($arr, fn($a, $b) => $a <=> $b);  // ascending
usort($arr, fn($a, $b) => $b <=> $a);  // descending
```

**Exam focus:** Spaceship returns exactly `-1`, `0`, or `1` — not just any negative/positive number.

#### Null Coalescing `??` and `??=`

```php
<?php

$val = $_GET['key'] ?? 'default';   // no E_NOTICE if key missing
$val ??= 'default';                  // assign default only if null

// ?? vs ?:
$a = null ?: "fallback";   // "fallback" (tests truthiness)
$b = null ?? "fallback";   // "fallback" (tests null only)
$c = 0 ?: "fallback";      // "fallback" (0 is falsy)
$d = 0 ?? "fallback";      // 0         (0 is not null)
```

**Exam focus:** `??` checks for `null` or undefined. `?:` checks for falsy. `0 ?? "x"` returns `0`. `0 ?: "x"` returns `"x"`.

### 3.3 Control Flow & Match Expressions

#### `match` vs `switch` — Critical Differences

```php
<?php

$val = "1";

// switch — loose comparison, fall-through
switch ($val) {
    case 1:          // "1" == 1 is TRUE (loose)
        echo "one";
        break;
}

// match — strict comparison, no fall-through, exhaustive
match ($val) {
    1       => "int one",      // "1" === 1 is FALSE
    "1"     => "string one",   // MATCHES here
    default => "other",
};
// Returns value, does not execute echo directly
```

| Feature | `switch` | `match` |
|---|---|---|
| Comparison | Loose (`==`) | Strict (`===`) |
| Fall-through | Yes (needs `break`) | No |
| Returns value | No | Yes |
| Exhaustive | No | Yes (throws `UnhandledMatchError`) |
| Multiple conditions | No | Yes: `1, 2 => ...` |

```php
<?php

// match with multiple conditions per arm
$status = 404;
$text = match($status) {
    200, 201 => "Success",
    301, 302 => "Redirect",
    404      => "Not Found",
    500      => "Server Error",
    default  => "Unknown",
};
```

**Exam focus:** `match` without `default` that receives an unmatched value throws `UnhandledMatchError`, NOT a `switch`-style "do nothing".

#### `for` vs `foreach` — Reference Pitfall

```php
<?php

$arr = [1, 2, 3];
foreach ($arr as &$val) {
    $val *= 2;
}
// $arr = [2, 4, 6]
// WARNING: $val still references $arr[2] after loop!
unset($val);  // ALWAYS unset after reference foreach

// Without unset:
foreach ($arr as $val) {  // second loop overwrites $arr[2] on last iteration
    // $arr becomes [2, 4, 4] (last element gets last value)
}
```

**Exam focus:** Forgetting `unset($val)` after a reference `foreach` is the #1 array trap on the exam.

### 3.4 Functions — Parameters, Scope & First-Class Callables

#### Parameter Types

```php
<?php

// Default values must be constant expressions
function foo(int $x, string $s = "default", array $a = []) {}

// Variadic
function sum(int ...$nums): int {
    return array_sum($nums);
}
sum(1, 2, 3);    // 6

// Named + variadic
function test(string $first, string ...$rest): void {}
test(first: "a", "b", "c");  // named must come last before variadics...
// Actually: named args cannot be used with variadics in PHP 8.0, allowed in 8.1+
```

#### Variable Scope

```php
<?php

$globalVar = "I'm global";

function noAccess() {
    echo $globalVar;  // NOTICE: undefined variable — NOT accessible
}

function withGlobal() {
    global $globalVar;
    echo $globalVar;  // "I'm global" — now accessible
}

function withStatic() {
    static $count = 0;  // initialized only ONCE across all calls
    $count++;
    echo $count;
}
withStatic(); // 1
withStatic(); // 2
withStatic(); // 3
```

**Exam focus:** PHP functions do NOT inherit the outer scope by default. `global` keyword or `use` (closures) required.

#### Closures & `use`

```php
<?php

$multiplier = 3;

$multiply = function(int $n) use ($multiplier): int {
    return $n * $multiplier;
};

// use by reference
$counter = 0;
$increment = function() use (&$counter): void {
    $counter++;
};
$increment();
$increment();
echo $counter; // 2

// Arrow functions (PHP 7.4+) — implicit capture by VALUE
$factor = 10;
$arrowFn = fn($x) => $x * $factor;  // $factor captured automatically
echo $arrowFn(5); // 50

// Arrow functions CANNOT capture by reference
```

**Exam focus:** Arrow functions (`fn`) capture outer variables **automatically by value**. Regular closures require explicit `use`. You cannot `use (&$var)` in arrow functions.

#### First-Class Callable Syntax (PHP 8.1)

```php
<?php

// Pre-8.1: using Closure::fromCallable()
$fn = Closure::fromCallable('strlen');

// PHP 8.1+: first-class callable syntax
$fn = strlen(...);    // creates Closure from named function
$fn("hello");         // 5

$arr = ["banana", "apple", "cherry"];
usort($arr, strcmp(...));  // use strcmp as callback directly
```

### 3.5 Arrays — Manipulation & Iteration

#### Essential Array Functions Reference

```php
<?php

// SORTING — know which preserve keys
sort($arr);          // reindex keys
asort($arr);         // preserve keys, sort by value
ksort($arr);         // sort by key
arsort($arr);        // preserve keys, sort by value DESC
krsort($arr);        // sort by key DESC
usort($arr, $cb);    // custom comparison, reindex
uasort($arr, $cb);   // custom comparison, preserve keys
uksort($arr, $cb);   // custom comparison on keys

// All sort functions return bool, modify IN PLACE
// rsort, arsort, krsort = reverse versions

// SEARCHING
in_array(42, $arr);           // loose by default
in_array(42, $arr, true);     // strict (third arg)
array_search(42, $arr);       // returns key or false
array_key_exists('k', $arr);  // checks key existence
isset($arr['k']);              // also checks not null

// TRANSFORMATION
array_map($cb, $arr);         // returns new array
array_filter($arr, $cb);      // returns filtered array, PRESERVES keys
array_reduce($arr, $cb, $init);
array_walk($arr, $cb);        // modifies in place, returns bool

// MERGING
array_merge($a, $b);          // numeric keys reindexed, string keys overwrite
array_merge_recursive($a, $b);// string key conflicts become arrays
$a + $b;                      // union: keeps first occurrence of each key

// SLICING & SPLICING
array_slice($arr, $offset, $length, $preserve_keys);
array_splice($arr, $offset, $length, $replacement); // modifies in place!
array_chunk($arr, $size, $preserve_keys);
array_unique($arr);           // PRESERVES original keys of first occurrences

// STACK/QUEUE OPERATIONS (modify original)
array_push($arr, $val);   // same as $arr[] = $val
array_pop($arr);          // remove/return last
array_shift($arr);        // remove/return first, REINDEX numeric keys
array_unshift($arr, $val);// prepend, REINDEX numeric keys

// FLIPPING & COMBINING
array_flip($arr);         // swap keys and values
array_combine($keys, $values); // throws ValueError if different sizes
array_zip_key($a, $b);    // does NOT exist — it's array_combine
```

**Exam focus:** `array_filter()` preserves keys. If you need a re-indexed result, wrap with `array_values(array_filter(...))`. This is tested constantly.

**Exam focus:** `array_merge()` with numeric keys **reindexes**. The `+` operator keeps existing keys. Know both behaviors:

```php
<?php

$a = [0 => 'a', 1 => 'b'];
$b = [0 => 'c', 1 => 'd'];

print_r(array_merge($a, $b));
// [0=>'a', 1=>'b', 2=>'c', 3=>'d']  — reindexed!

print_r($a + $b);
// [0=>'a', 1=>'b']  — $b values ignored (keys already exist in $a)
```

#### Unpacking & Spread

```php
<?php

$first = [1, 2, 3];
$second = [4, 5, 6];
$merged = [...$first, ...$second];  // [1,2,3,4,5,6]

// PHP 8.1: string-keyed array unpacking
$defaults = ['color' => 'red', 'size' => 'M'];
$custom   = ['size' => 'L'];
$final = [...$defaults, ...$custom];  // ['color'=>'red', 'size'=>'L']
```

### 3.6 Strings & Regex

#### String Functions — Exam Critical

```php
<?php

// POSITION FINDING
strpos("hello world", "world");   // 6 (int)
strpos("hello", "xyz");           // false (NOT -1!)
strrpos("abcabc", "c");           // 5 (last occurrence)
stripos("Hello", "hello");        // 0 (case-insensitive)

// Use strict comparison with strpos!
if (strpos($str, "needle") !== false) { ... }  // CORRECT
if (strpos($str, "needle")) { ... }             // WRONG if needle at position 0

// SUBSTRING
substr("Hello World", 6);         // "World"
substr("Hello World", 6, 3);      // "Wor"
substr("Hello", -3);              // "llo" (from end)
substr("Hello", -3, 2);           // "ll"

// REPLACEMENT
str_replace("old", "new", $str);        // case-sensitive
str_ireplace("old", "new", $str);       // case-insensitive
substr_replace($str, "new", 2, 4);      // replace 4 chars starting at offset 2
str_replace(["a","b"], ["1","2"], $str);// array replacement

// PADDING & TRIMMING
str_pad("42", 5);               // "42   " (right-pad with space)
str_pad("42", 5, "0", STR_PAD_LEFT);  // "00042"
str_pad("42", 5, "0", STR_PAD_BOTH);  // "0420 " (left gets extra if odd)
ltrim($str);                    // left trim (whitespace by default)
rtrim($str);                    // right trim
trim($str, "xy");               // trim specific characters

// SPLITTING & JOINING
explode(",", "a,b,c");          // ["a","b","c"]
explode(",", "a,b,c", 2);       // ["a","b,c"] (limit)
implode(",", ["a","b","c"]);    // "a,b,c"
str_split("hello", 2);          // ["he","ll","o"]
chunk_split($str, 76, "\r\n");  // add line breaks every 76 chars

// COMPARISON
strcmp("a", "b");    // < 0 (a comes before b)
strcasecmp("A","a"); // 0
similar_text("Hello", "World", $percent); // $percent = similarity %
levenshtein("kitten", "sitting"); // 3
soundex("Robert"); // "R163"
metaphone("Smith"); // "SM0"

// FORMATTING
number_format(1234567.891, 2, '.', ','); // "1,234,567.89"
sprintf("%05d", 42);    // "00042"
sprintf("%.2f", 3.14159); // "3.14"
printf("%s has %d items", "Cart", 5);
```

**Exam focus:** `strpos()` returns `false` (not `-1`) when not found. Always use `!== false` comparison.

#### PCRE Regex

```php
<?php

// Core functions
preg_match('/pattern/flags', $subject, $matches);    // 1=match, 0=no match, false=error
preg_match_all('/(\d+)/', "12 and 34", $matches);    // returns count of matches
preg_replace('/old/', 'new', $subject);              // returns modified string
preg_split('/[\s,]+/', "one two,three");             // returns array
preg_grep('/^\d+$/', $array);                        // filter array by regex

// Modifiers
// i = case-insensitive
// m = multiline (^ and $ match line boundaries)
// s = DOTALL (. matches newlines)
// x = extended (whitespace ignored, comments allowed)
// u = unicode mode

// Named captures
preg_match('/(?P<year>\d{4})-(?P<month>\d{2})/', '2024-05', $m);
echo $m['year'];   // 2024
echo $m['month'];  // 05

// Lookahead / lookbehind
preg_match('/foo(?=bar)/', 'foobar');    // positive lookahead
preg_match('/foo(?!bar)/', 'foobaz');   // negative lookahead
preg_match('/(?<=foo)bar/', 'foobar');  // positive lookbehind
preg_match('/(?<!foo)bar/', 'bazbar');  // negative lookbehind
```

**Exam focus:** `preg_match()` stops at first match. `preg_match_all()` finds all matches. The `$matches[0]` is always the full match; `$matches[1]`, `$matches[2]` are capture groups.

### 3.7 OOP — Classes, Interfaces, Traits & Enums

#### Class Fundamentals

```php
<?php

abstract class Animal {
    // Properties
    public string $name;
    protected int $age;
    private float $weight;
    public static int $count = 0;
    public readonly string $species;  // PHP 8.1

    // Constructor
    public function __construct(string $name, int $age) {
        $this->name    = $name;
        $this->age     = $age;
        $this->species = "Unknown";  // readonly can be set in constructor
        self::$count++;
    }

    // Abstract method — forces subclass implementation
    abstract public function speak(): string;

    // Regular method
    public function describe(): string {
        return "{$this->name}, age {$this->age}";
    }

    // Static method
    public static function getCount(): int {
        return self::$count;   // self = current class definition
    }
}

class Dog extends Animal {
    public function speak(): string {
        return "Woof!";
    }

    public function parentDescribe(): string {
        return parent::describe();  // call parent method
    }
}
```

#### Late Static Binding (`static::` vs `self::`)

```php
<?php

class Base {
    public static function create(): static {
        return new static();  // creates instance of ACTUAL called class
    }

    public static function selfCreate(): self {
        return new self();    // always creates Base, even when called on Child
    }

    public static function who(): string {
        return static::class; // late static binding — actual class
    }
}

class Child extends Base {}

$obj1 = Child::create();      // Child instance  (static::)
$obj2 = Child::selfCreate();  // Base instance   (self::)
echo Child::who();            // "Child"
```

**Exam focus:** `self::` resolves at **definition time** (always the class where the method is written). `static::` resolves at **call time** (the actual class used to call the method). This is Late Static Binding (LSB).

#### Interfaces

```php
<?php

interface Printable {
    public function print(): void;  // implicitly public, abstract
}

interface Serializable extends Printable {
    public function serialize(): string;
    public function unserialize(string $data): void;
}

// Class can implement multiple interfaces
class Document implements Printable, JsonSerializable {
    public function print(): void { echo $this->content; }
    public function jsonSerialize(): mixed { return ['content' => $this->content]; }
}
```

**Exam focus:** Interfaces can extend multiple interfaces. Classes can implement multiple interfaces. Interface constants ARE allowed (PHP 8.1: can be marked `final`).

#### Traits

```php
<?php

trait Timestamps {
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function setCreatedAt(): void {
        $this->createdAt = new DateTime();
    }

    // Trait can have abstract methods
    abstract protected function getTableName(): string;
}

trait SoftDelete {
    private ?DateTime $deletedAt = null;

    public function delete(): void {
        $this->deletedAt = new DateTime();
    }
}

class User {
    use Timestamps, SoftDelete;  // multiple traits

    protected function getTableName(): string { return 'users'; }
}

// Conflict resolution
class Post {
    use TraitA, TraitB {
        TraitA::hello insteadof TraitB;  // use TraitA's hello
        TraitB::hello as helloB;         // alias TraitB's hello
        TraitB::privateMethod as public; // change visibility
    }
}
```

**Exam focus:** Trait method conflict resolution: `insteadof` to choose which trait's method wins; `as` to create an alias. A class method ALWAYS overrides a trait method.

#### Enums (PHP 8.1)

```php
<?php

// Pure enum (no backing type)
enum Suit {
    case Hearts;
    case Diamonds;
    case Clubs;
    case Spades;
}

$card = Suit::Hearts;
echo $card->name;  // "Hearts"

// Backed enum (int or string)
enum Color: string {
    case Red   = 'red';
    case Green = 'green';
    case Blue  = 'blue';

    // Methods allowed
    public function label(): string {
        return ucfirst($this->value);
    }

    // Static methods allowed
    public static function fromLabel(string $label): self {
        return self::from(strtolower($label));
    }
}

Color::from('red');         // Color::Red (throws ValueError if not found)
Color::tryFrom('invalid');  // null (safe version)
Color::Red->value;          // 'red'
Color::Red->name;           // 'Red'
Color::cases();             // [Color::Red, Color::Green, Color::Blue]

// Enums can implement interfaces
enum Status: int implements HasLabel {
    case Active   = 1;
    case Inactive = 0;

    public function label(): string {
        return match($this) {
            Status::Active   => "Active User",
            Status::Inactive => "Inactive User",
        };
    }
}

// Enums CAN have constants, CANNOT have properties (other than $name, $value)
// Enums CANNOT be instantiated with new
// Enums CAN use traits
```

**Exam focus:** Pure enums have only `->name`. Backed enums have both `->name` and `->value`. `from()` throws `ValueError`; `tryFrom()` returns `null`.

#### Magic Methods

```php
<?php

class Magic {
    private array $data = [];

    // Property access
    public function __get(string $name): mixed { return $this->data[$name] ?? null; }
    public function __set(string $name, mixed $value): void { $this->data[$name] = $value; }
    public function __isset(string $name): bool { return isset($this->data[$name]); }
    public function __unset(string $name): void { unset($this->data[$name]); }

    // Method calls
    public function __call(string $name, array $args): mixed {
        // called when inaccessible instance method called
    }
    public static function __callStatic(string $name, array $args): mixed {
        // called when inaccessible static method called
    }

    // String conversion
    public function __toString(): string { return json_encode($this->data); }

    // Invocation
    public function __invoke(mixed ...$args): mixed { /* called as $obj() */ }

    // Serialization
    public function __sleep(): array { return ['data']; }  // return property names to serialize
    public function __wakeup(): void { /* called on unserialize */ }
    public function __serialize(): array { return $this->data; }    // PHP 7.4+
    public function __unserialize(array $data): void { $this->data = $data; }

    // Cloning
    public function __clone(): void { /* deep copy logic here */ }

    // Object creation (rarely tested)
    public static function __set_state(array $props): static { /* var_export handler */ }
    public function __debugInfo(): array { /* var_dump output */ }
}
```

**Exam focus:** `__get` / `__set` are only called when the property is **inaccessible** (doesn't exist or is private/protected from outside). They are NOT called for accessible public properties.

### 3.8 Error Handling & Exceptions

#### Exception Hierarchy

> **Correction:** The SPL exception classes do NOT flatten directly under `Exception`. `BadFunctionCallException`, `DomainException`, `InvalidArgumentException`, `LengthException`, and `OutOfRangeException` all extend `LogicException`. `OutOfBoundsException`, `OverflowException`, `RangeException`, `UnderflowException`, and `UnexpectedValueException` all extend `RuntimeException`. Verified via `get_parent_class()` in PHP 8.4.

```
Throwable
|-- Error
|   |-- ArithmeticError
|   |   +-- DivisionByZeroError
|   |-- AssertionError
|   |-- ParseError
|   |-- TypeError
|   |-- ValueError (PHP 8)
|   |-- UnhandledMatchError (PHP 8)
|   +-- FiberError (PHP 8.1)
+-- Exception
    |-- LogicException
    |   |-- BadFunctionCallException
    |   |   +-- BadMethodCallException
    |   |-- DomainException
    |   |-- InvalidArgumentException
    |   |-- LengthException
    |   +-- OutOfRangeException
    +-- RuntimeException
        |-- OutOfBoundsException
        |-- OverflowException
        |-- RangeException
        |-- UnderflowException
        +-- UnexpectedValueException
```

**Exam focus:** `Error` and `Exception` both implement `Throwable`. You can `catch(Throwable $e)` to catch everything. `catch(Error $e)` catches engine errors only. `catch(Exception $e)` catches application exceptions only.

**Exam focus (critical for exam):**
- `LogicException` children = errors you *should have prevented* (bad arguments, out of defined range): `BadFunctionCallException`, `BadMethodCallException`, `DomainException`, `InvalidArgumentException`, `LengthException`, `OutOfRangeException`
- `RuntimeException` children = errors that *can only be detected at runtime* (out of bounds on actual data, overflow, underflow): `OutOfBoundsException`, `OverflowException`, `RangeException`, `UnderflowException`, `UnexpectedValueException`

```php
<?php

try {
    // risky code
} catch (InvalidArgumentException | ValueError $e) {
    // catch multiple types (PHP 8: union catches)
    echo $e->getMessage();
} catch (RuntimeException $e) {
    // catch parent catches subclasses too
} catch (Throwable $e) {
    // catch absolutely everything
} finally {
    // ALWAYS runs, even if exception thrown, even if return called
    // finally runs BEFORE the return value is passed out
}

// Custom exception
class DatabaseException extends RuntimeException {
    public function __construct(
        string $message,
        private readonly string $query,  // promoted readonly
        int $code = 0,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    public function getQuery(): string { return $this->query; }
}
```

**Exam focus:** `finally` runs **always** — even when a `return` is hit in `try` or `catch`. If `finally` has its own `return`, it **overrides** the try/catch return.

#### Error Functions

```php
<?php

// Custom error handler
set_error_handler(function(int $errno, string $errstr, string $file, int $line): bool {
    // return true = error handled (suppress default handler)
    // return false = let default handler run
});

// Exception handler (for uncaught exceptions)
set_exception_handler(function(\Throwable $e): void {
    // handle uncaught exception
});

// Trigger errors
trigger_error("Something went wrong", E_USER_WARNING);
// E_USER_ERROR, E_USER_WARNING, E_USER_NOTICE, E_USER_DEPRECATED

// Error levels
error_reporting(E_ALL);            // report all
error_reporting(E_ALL & ~E_NOTICE);// all except notices
```

### 3.9 Fibers & Generators

#### Generators

```php
<?php

function fibonacci(): Generator {
    [$a, $b] = [0, 1];
    while (true) {
        yield $a;          // suspend, return value
        [$a, $b] = [$b, $a + $b];
    }
}

$gen = fibonacci();
echo $gen->current();  // 0
$gen->next();
echo $gen->current();  // 1

// yield with key => value
function indexedGenerator(): Generator {
    yield 'first'  => 1;
    yield 'second' => 2;
}

// send value INTO generator
function accumulator(): Generator {
    $total = 0;
    while (true) {
        $value = yield $total;  // yield current total, receive next value
        if ($value === null) break;
        $total += $value;
    }
}

$acc = accumulator();
$acc->current();    // initialize (run to first yield) = 0
$acc->send(10);     // send 10, returns new yield value = 10
$acc->send(20);     // returns 30

// yield from — delegation
function inner(): Generator {
    yield 1;
    yield 2;
    return "inner_return";
}

function outer(): Generator {
    $result = yield from inner();  // $result = "inner_return"
    yield 3;
}
```

**Exam focus:** `yield from` delegates to another generator/iterable and captures its `return` value. The outer generator continues after the inner one finishes.

#### Fibers (PHP 8.1)

```php
<?php

$fiber = new Fiber(function(): string {
    $value = Fiber::suspend("fiber started");  // suspend, pass value OUT
    echo "Fiber received: $value\n";
    return "fiber done";
});

$result1 = $fiber->start();          // "fiber started" (value from first suspend)
$result2 = $fiber->resume("hello");  // fiber received: hello; returns next suspend or null
echo $fiber->getReturn();            // "fiber done" (after fiber completes)

// Fiber states
$fiber->isStarted();
$fiber->isRunning();
$fiber->isSuspended();
$fiber->isTerminated();
```

**Exam focus:** Fibers differ from generators: Fibers are independent execution stacks; `Fiber::suspend()` is a static method called from within the fiber. Generators use `yield` inline.

---

## 4. Section B — Extended Engine (EE) Features

### 4.1 Type System Enhancements (PHP 8.x)

#### Complete Type Reference

```php
<?php

// Union types (PHP 8.0)
function process(int|string $value): int|false { }

// Intersection types (PHP 8.1) — ALL types must be satisfied
function save(Serializable&Countable $obj): void { }

// DNF Types (PHP 8.2) — Disjunctive Normal Form
function handle((Serializable&Countable)|null $obj): void { }

// nullable shorthand
function foo(?string $s): ?int { }  // same as string|null, int|null

// Return types
function noReturn(): never {     // function MUST throw or exit, never returns
    throw new Exception();
}

function voidFn(): void {        // returns nothing (can have bare return;)
    return;                      // OK
    return null;                 // Error!
    return 1;                    // Error!
}

// mixed type
function anything(mixed $val): mixed { }  // = any type including null

// static return type (PHP 8.0)
class Builder {
    public function setName(string $n): static {  // returns same type as caller
        $this->name = $n;
        return $this;
    }
}
```

**Exam focus:** `never` means the function **must** throw an exception or call `exit()`/`die()`. It can never return normally — not even `return null`. `void` can return with a bare `return;` but not `return value`.

#### Covariance & Contravariance

```php
<?php

class Animal {}
class Cat extends Animal {}

interface AnimalFactory {
    public function make(): Animal;          // return type
    public function feed(Cat $cat): void;    // parameter type
}

// Covariant return type — can be MORE specific (narrower)
class CatFactory implements AnimalFactory {
    public function make(): Cat { return new Cat(); }  // OK: Cat is subtype of Animal

    // Contravariant parameter — can be LESS specific (wider)
    public function feed(Animal $animal): void { }     // OK: Animal is supertype of Cat
}
```

**Exam focus:** **Covariance** = return types can be narrowed in subtypes. **Contravariance** = parameter types can be widened in subtypes. Violating these throws a fatal error.

### 4.2 Named Arguments & Attributes

#### Named Arguments (PHP 8.0)

```php
<?php

// Traditional positional
htmlspecialchars($string, ENT_QUOTES, 'UTF-8', false);

// Named — order doesn't matter, skip optional args
htmlspecialchars(string: $string, double_encode: false);

// Named with built-in functions
array_slice(array: $arr, offset: 2, length: 3, preserve_keys: true);

// Mixing positional and named (positional MUST come first)
str_pad($string, 10, pad_type: STR_PAD_LEFT);

// Named cannot be used twice
// str_pad(string: $s, string: $s); // Fatal Error
```

**Exam focus:** Named arguments cannot be combined with positional arguments that appear **after** named ones. All positional arguments must precede named arguments.

#### Attributes (PHP 8.0)

```php
<?php

// Defining a custom attribute
#[Attribute]                        // marks class as an attribute
#[Attribute(Attribute::TARGET_METHOD | Attribute::TARGET_FUNCTION)]
class Deprecated {
    public function __construct(
        public readonly string $reason = '',
        public readonly string $since  = ''
    ) {}
}

// Using attributes
#[Deprecated(reason: "Use newMethod() instead", since: "2.0")]
function oldMethod(): void {}

#[Route('/users', methods: ['GET', 'POST'])]
class UserController {}

// Reading attributes via Reflection
$ref  = new ReflectionFunction('oldMethod');
$attrs = $ref->getAttributes(Deprecated::class);
foreach ($attrs as $attr) {
    $instance = $attr->newInstance();  // instantiates the attribute class
    echo $instance->reason;
}

// Attribute targets
Attribute::TARGET_CLASS
Attribute::TARGET_FUNCTION
Attribute::TARGET_METHOD
Attribute::TARGET_PROPERTY
Attribute::TARGET_CLASS_CONSTANT
Attribute::TARGET_PARAMETER
Attribute::TARGET_ALL            // default
Attribute::IS_REPEATABLE         // allow multiple on same target
```

### 4.3 Constructor Promotion & Readonly

#### Constructor Property Promotion (PHP 8.0)

```php
<?php

// Traditional
class Point {
    public float $x;
    public float $y;
    public function __construct(float $x, float $y) {
        $this->x = $x;
        $this->y = $y;
    }
}

// Promoted — identical behavior, less code
class Point {
    public function __construct(
        public float $x,
        public float $y,
        private string $label = 'point',
    ) {}
}

// Promotion rules:
// - Only in __construct
// - Cannot use 'var' keyword
// - Cannot combine with regular property declaration of same name
// - Default values follow same rules as regular parameters
// - Works with all visibility modifiers: public, protected, private
// - Works with readonly (PHP 8.1)
```

#### Readonly Properties (PHP 8.1)

```php
<?php

class Config {
    public readonly string $dsn;

    public function __construct(string $dsn) {
        $this->dsn = $dsn;  // CAN set in constructor
    }
}

$c = new Config("mysql:host=localhost");
echo $c->dsn;  // OK
$c->dsn = "new";  // Fatal: Cannot modify readonly property

// PHP 8.2: Readonly classes
readonly class Point {
    public function __construct(
        public float $x,
        public float $y,
    ) {}
    // ALL properties implicitly readonly
}
```

**Exam focus:** `readonly` properties can only be written **once** — in the constructor (or at declaration for simple values). After first write, they're immutable. `readonly` is not supported on `static` properties.

### 4.4 JIT Compilation

```
PHP Execution Pipeline:

  Source Code (.php)
       |
       v
  Lexer (tokenize)
       |
       v
  Parser (AST)
       |
       v
  Compiler (opcodes)
       |
       v
  OPcache (store opcodes) <--- JIT reads from here
       |
       v
  Zend VM (interpret)        <-- or -->  JIT-compiled native code
                                         (bypasses VM for hot code)
```

**JIT Configuration in php.ini:**

```ini
; OPcache must be enabled for JIT to work
opcache.enable=1
opcache.jit_buffer_size=128M   ; 0 = disabled
opcache.jit=1255               ; 4-digit control code

; JIT mode digits: CRTO (C=cpu-specific, R=register allocation, T=trigger, O=optimization)
; C = cpu-specific optimization (0-5)
; R = register allocation (0=none, 1=local, 2=global)
; T = trigger (0=script load, 1=profiling run, 2=function hot, 3=trace, 4=compile all, 5=re-JIT)
; O = optimization level (0-5)
; Common values:
opcache.jit=on       ; equivalent to 1255 (tracing JIT, recommended)
opcache.jit=tracing  ; same as 1255
opcache.jit=function ; function-level JIT (1205)
opcache.jit=off      ; disable JIT
```

**Exam focus:** JIT requires OPcache (`opcache.enable=1`). JIT benefits **CPU-intensive** operations (math, tight loops). It provides little/no benefit for typical I/O-bound web apps. JIT is a PHP 8.0 feature.

### 4.5 Match, Nullsafe & Spread Operator

#### Nullsafe Operator `?->` (PHP 8.0)

```php
<?php

// Without nullsafe (PHP 7)
$result = null;
if ($user !== null) {
    $address = $user->getAddress();
    if ($address !== null) {
        $city = $address->getCity();
        if ($city !== null) {
            $result = $city->getName();
        }
    }
}

// With nullsafe operator (PHP 8.0)
$result = $user?->getAddress()?->getCity()?->getName();

// Chain stops at first null — subsequent calls are skipped, returns null
// Works with methods AND properties:
$name = $user?->profile?->displayName;

// Does NOT work with static calls (->  only, not ::)
// $obj?::staticMethod() is NOT valid syntax
```

**Exam focus:** The nullsafe chain short-circuits — if any `?->` receives `null`, the rest of the chain is **not evaluated** and the whole expression returns `null`.

#### Spread Operator

```php
<?php

// Unpack array into function arguments
function add(int $a, int $b, int $c): int { return $a + $b + $c; }
$args = [1, 2, 3];
echo add(...$args);  // 6

// Named argument spread (PHP 8.1)
$args = ['c' => 3, 'a' => 1, 'b' => 2];
echo add(...$args);  // 6

// In array literals
$a = [1, 2, 3];
$b = [0, ...$a, 4, 5]; // [0, 1, 2, 3, 4, 5]
```

### 4.6 String Functions & Multibyte

#### New String Functions (PHP 8.0)

```php
<?php

// str_contains — case-sensitive substring check
str_contains("Hello World", "World");  // true
str_contains("Hello", "");             // true (empty always true!)

// str_starts_with
str_starts_with("Hello World", "Hello"); // true
str_starts_with("Hello", "");            // true

// str_ends_with
str_ends_with("Hello World", "World");   // true
str_ends_with("Hello", "");              // true

// All three: empty needle always returns true
```

**Exam focus:** `str_contains`, `str_starts_with`, `str_ends_with` all return `true` for an empty needle string. This is a common trap question.

#### Multibyte String Functions

```php
<?php

// mb_ prefix for Unicode-safe operations
mb_strlen("Héllo");           // 5 (counts characters, not bytes)
strlen("Héllo");              // 6 (counts bytes, é = 2 bytes in UTF-8)

mb_substr("Héllo", 1, 3);    // "éll"
mb_strtolower("HÉLLO");      // "héllo"
mb_strtoupper("héllo");      // "HÉLLO"
mb_strpos("Héllo", "é");     // 1

// Setting encoding
mb_internal_encoding("UTF-8");
mb_detect_encoding($str, ["UTF-8", "ISO-8859-1"]);

// mb_convert_encoding
mb_convert_encoding($str, "UTF-8", "ISO-8859-1");
```

**Exam focus:** `mb_strlen()` vs `strlen()` — `strlen()` returns **bytes**, `mb_strlen()` returns **characters**. For UTF-8 multibyte strings, these differ.

### 4.7 Date/Time & Intl Extension

#### DateTime / DateTimeImmutable

```php
<?php

// DateTime (mutable) vs DateTimeImmutable (immutable)
$dt = new DateTime('2024-01-15 10:30:00');
$dt->modify('+1 day');  // modifies $dt in place

$dti = new DateTimeImmutable('2024-01-15');
$new = $dti->modify('+1 day');  // returns NEW object, $dti unchanged!

// Creating from format
$dt = DateTime::createFromFormat('d/m/Y', '15/01/2024');
$dt = new DateTime('@1705312200');  // from Unix timestamp

// Formatting
echo $dt->format('Y-m-d H:i:s');   // 2024-01-15 10:30:00
echo $dt->format('D, d M Y');       // Mon, 15 Jan 2024

// DateInterval
$interval = new DateInterval('P1Y2M3DT4H5M6S');
// P=period, Y=year, M=month, D=day, T=time separator
// H=hour, M=minute, S=second

$start = new DateTime('2024-01-01');
$end   = new DateTime('2024-12-31');
$diff  = $start->diff($end);
echo $diff->days;   // total days
echo $diff->m;      // months component

// DateTimeZone
$tz = new DateTimeZone('America/New_York');
$dt = new DateTime('now', $tz);
$dt->setTimezone(new DateTimeZone('UTC'));
```

**Exam focus:** `DateTimeImmutable::modify()` returns a **new** object. `DateTime::modify()` modifies in place and returns `$this`. Mixing them up is a common exam trap.

---

## 5. Section C — Web & Cloud Configuration

### 5.1 php.ini Directives — Complete Reference

#### Core Configuration Categories

```ini
;;;; ERRORS ;;;;
error_reporting = E_ALL                    ; report all errors
display_errors = On                        ; show errors to browser (dev only!)
display_startup_errors = On               ; show startup errors
log_errors = On                           ; log to error_log file
error_log = /var/log/php/error.log        ; log file location
html_errors = On                          ; format errors as HTML

;;;; EXECUTION LIMITS ;;;;
max_execution_time = 30                   ; seconds (0 = no limit)
max_input_time = 60                       ; time to parse input
memory_limit = 128M                       ; -1 = no limit
                                          ; must be larger than post_max_size

;;;; FILE UPLOADS ;;;;
file_uploads = On
upload_max_filesize = 2M                  ; max single file size
post_max_size = 8M                        ; MUST be >= upload_max_filesize
max_file_uploads = 20                     ; max files per request
upload_tmp_dir = /tmp                     ; temp directory for uploads

;;;; SESSION ;;;;
session.save_handler = files              ; files|memcache|redis|user
session.save_path = /var/lib/php/sessions
session.name = PHPSESSID
session.gc_maxlifetime = 1440             ; seconds (24 min default)
session.gc_probability = 1               ; numerator
session.gc_divisor = 100                 ; probability = 1/100 = 1%
session.cookie_lifetime = 0              ; 0 = until browser close
session.cookie_secure = On               ; HTTPS only
session.cookie_httponly = On             ; no JS access
session.cookie_samesite = Strict         ; Strict|Lax|None
session.use_strict_mode = 1              ; reject uninitialized session IDs
session.use_only_cookies = 1             ; don't pass session ID in URL

;;;; OUTPUT ;;;;
output_buffering = 4096                  ; buffer size (Off|On|integer)
implicit_flush = Off
default_charset = "UTF-8"

;;;; MISC ;;;;
date.timezone = "UTC"                    ; MUST be set (avoid warnings)
default_socket_timeout = 60
allow_url_fopen = On                     ; allow remote file URLs
allow_url_include = Off                  ; SECURITY: keep Off
expose_php = Off                         ; hide PHP version in headers
open_basedir = /var/www/html             ; restrict file access to path
disable_functions = exec,passthru,shell_exec,system
```

**Exam focus:** `post_max_size` must be **greater than or equal to** `upload_max_filesize`. If `memory_limit` is smaller than `post_max_size`, uploads will fail. `memory_limit` should be the largest.

```
Memory hierarchy:
  memory_limit >= post_max_size >= upload_max_filesize
```

#### Runtime Configuration Override

```php
<?php

// ini_set — change at runtime (not all directives changeable)
ini_set('display_errors', '1');
ini_set('memory_limit', '256M');
ini_set('max_execution_time', '120');

// ini_get — read current value
$limit = ini_get('memory_limit');

// ini_restore — restore to php.ini value
ini_restore('display_errors');

// PHP_INI_* constants (where directive can be set)
// PHP_INI_USER    — ini_set() and user scripts
// PHP_INI_PERDIR  — php.ini, .htaccess, httpd.conf
// PHP_INI_SYSTEM  — php.ini and httpd.conf only
// PHP_INI_ALL     — anywhere
```

**Exam focus:** Some directives are **PHP_INI_SYSTEM** only — they cannot be changed with `ini_set()`. Examples: `disable_functions`, `open_basedir`, `extension`. Others like `display_errors` are PHP_INI_ALL and can be set anywhere.

### 5.2 Apache & Nginx Integration

#### Apache Configuration

```apache
# Enabling PHP via module
LoadModule php_module modules/libphp.so
AddHandler application/x-httpd-php .php

# PHP via .htaccess
<IfModule php_module>
    php_value memory_limit 256M
    php_flag display_errors Off
    php_admin_value error_log /var/log/php_errors.log
</IfModule>

# php_value     = PHP_INI_PERDIR directives (user can override)
# php_flag      = boolean PHP_INI_PERDIR directives
# php_admin_value  = cannot be overridden by user scripts
# php_admin_flag   = boolean, cannot be overridden
```

#### PHP-FPM (FastCGI Process Manager)

```ini
; /etc/php/8.2/fpm/pool.d/www.conf

[www]
user  = www-data
group = www-data
listen = /run/php/php8.2-fpm.sock   ; Unix socket (better than TCP for local)
; listen = 127.0.0.1:9000           ; TCP alternative

pm = dynamic
pm.max_children     = 50
pm.start_servers    = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests     = 500           ; recycle workers after N requests (prevents memory leaks)

php_admin_value[error_log] = /var/log/php-fpm/www-error.log
php_admin_flag[log_errors]  = on
php_value[session.save_handler] = files
php_value[session.save_path]    = /var/lib/php/sessions
```

```nginx
# Nginx + PHP-FPM
server {
    listen 80;
    root /var/www/html;
    index index.php index.html;

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    # Security: deny access to .php files in upload directories
    location ~* /uploads/.*\.php$ {
        deny all;
    }
}
```

**Exam focus:** PHP-FPM `pm.max_requests` controls worker recycling — prevents memory leaks from long-running processes. The `pm` modes are: `static` (fixed), `dynamic` (variable), `ondemand` (spawn on request).

### 5.3 Sessions & Cookies

#### Session Lifecycle

```php
<?php

// 1. Start session
session_start();  // MUST be before any output

// 2. Set data
$_SESSION['user_id'] = 42;
$_SESSION['username'] = 'alice';

// 3. Regenerate ID (after login — prevents session fixation)
session_regenerate_id(true);  // true = delete old session file

// 4. Read data
$id = $_SESSION['user_id'] ?? null;

// 5. Remove specific key
unset($_SESSION['username']);

// 6. Destroy session completely
session_unset();      // clear all session vars (legacy)
$_SESSION = [];       // clear session vars (preferred)
session_destroy();    // destroy session file

// Session cookie cleanup
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Session ID
echo session_id();                // get current session ID
session_id('custom_id');          // set session ID (before session_start)
echo session_name();              // "PHPSESSID" by default
echo session_status();            // PHP_SESSION_DISABLED | PHP_SESSION_NONE | PHP_SESSION_ACTIVE
```

**Exam focus:** `session_regenerate_id(true)` should be called after successful login to prevent **session fixation** attacks. The `true` parameter deletes the old session file.

#### Cookie Handling

```php
<?php

// setcookie — MUST be called before any output (like header())
setcookie(
    name:     'user_pref',
    value:    'dark_mode',
    expires:  time() + (86400 * 30),  // 30 days
    path:     '/',
    domain:   '.example.com',         // leading dot = include subdomains
    secure:   true,                   // HTTPS only
    httponly: true                    // JavaScript cannot access
);

// PHP 7.3+: samesite option via options array
setcookie('token', $value, [
    'expires'  => time() + 3600,
    'path'     => '/',
    'domain'   => 'example.com',
    'secure'   => true,
    'httponly' => true,
    'samesite' => 'Strict',  // Strict | Lax | None
]);

// Deleting a cookie: set expiry in the past
setcookie('user_pref', '', time() - 3600);

// Reading cookies
$pref = $_COOKIE['user_pref'] ?? 'light_mode';
```

**Exam focus:** `SameSite=None` requires `Secure=true`. `SameSite=Strict` blocks the cookie on ALL cross-site requests (including top-level navigation). `SameSite=Lax` allows top-level GET navigation but blocks others.

### 5.4 Output Buffering & Headers

#### Output Buffering

```php
<?php

ob_start();                     // begin buffering
echo "This goes to buffer";
$content = ob_get_contents();   // read buffer contents
ob_end_clean();                 // discard buffer and turn off buffering
ob_end_flush();                 // send buffer to client and turn off
ob_flush();                     // send buffer to client (keep buffering on)
ob_clean();                     // discard buffer (keep buffering on)
$level = ob_get_level();        // nesting level (0 = no buffering)
$length = ob_get_length();      // current buffer size

// Nested buffering
ob_start();              // level 1
ob_start();              // level 2
echo "inner";
$inner = ob_get_clean(); // get level 2, turn it off
echo "outer: $inner";
$outer = ob_get_clean(); // get level 1, turn it off

// Callback function
ob_start(function(string $buffer): string {
    return strtoupper($buffer);  // transform output
});
```

#### Headers

```php
<?php

// MUST be sent before any body output
header('Content-Type: application/json; charset=UTF-8');
header('Location: https://example.com/new-page', true, 302);
header('Cache-Control: no-cache, no-store, must-revalidate');
header('X-Frame-Options: DENY');
header('Content-Disposition: attachment; filename="file.pdf"');

// Redirects
header('Location: /login', true, 301);  // permanent
header('Location: /dashboard', true, 302);  // temporary (default)
header('Location: /other', true, 307);  // temporary, preserve method
exit;  // ALWAYS call exit/die after redirect header!

// Remove a header
header_remove('X-Powered-By');
header_remove();  // remove ALL previously set headers

// Check if headers sent
if (!headers_sent($file, $line)) {
    header('...');
} else {
    echo "Headers already sent in $file on line $line";
}

// http_response_code
http_response_code(404);       // set response code
$code = http_response_code();  // get current response code
```

**Exam focus:** Headers must be sent before any output. If output buffering is active, "output" doesn't reach the browser until the buffer is flushed — so `header()` can be called after `echo` if buffering is on. `headers_sent()` returns true if even one byte was sent.

### 5.5 File Uploads & Streams

#### File Upload Processing

```php
<?php

// $_FILES structure
/*
$_FILES['userfile'] = [
    'name'     => 'photo.jpg',       // original filename (user-provided, untrusted!)
    'type'     => 'image/jpeg',      // MIME type (user-provided, untrusted!)
    'size'     => 51234,             // size in bytes
    'tmp_name' => '/tmp/phpABCDEF', // server temp file path
    'error'    => UPLOAD_ERR_OK,     // error code
    'full_path'=> 'photos/photo.jpg' // PHP 8.1: full path for directory upload
];
*/

// Error codes
// UPLOAD_ERR_OK         = 0  success
// UPLOAD_ERR_INI_SIZE   = 1  exceeds upload_max_filesize
// UPLOAD_ERR_FORM_SIZE  = 2  exceeds MAX_FILE_SIZE form field
// UPLOAD_ERR_PARTIAL    = 3  only partially uploaded
// UPLOAD_ERR_NO_FILE    = 4  no file was uploaded
// UPLOAD_ERR_NO_TMP_DIR = 6  missing temp folder
// UPLOAD_ERR_CANT_WRITE = 7  failed to write to disk
// UPLOAD_ERR_EXTENSION  = 8  PHP extension stopped upload

function processUpload(array $file): string {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException("Upload error: " . $file['error']);
    }

    // ALWAYS use is_uploaded_file for security!
    if (!is_uploaded_file($file['tmp_name'])) {
        throw new RuntimeException("Not an uploaded file!");
    }

    // Validate MIME type using finfo (NOT $_FILES['type'])
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    $allowed = ['image/jpeg', 'image/png', 'image/gif'];

    if (!in_array($mimeType, $allowed, true)) {
        throw new RuntimeException("Invalid file type");
    }

    // Move to permanent location
    $destination = '/var/www/uploads/' . uniqid() . '.jpg';
    move_uploaded_file($file['tmp_name'], $destination);

    return $destination;
}
```

**Exam focus:** **Never trust** `$_FILES['type']` for MIME validation — it's user-controlled. Always use `finfo_file()` or `mime_content_type()` on the actual temp file. Always use `is_uploaded_file()` before processing.

#### PHP Streams

```php
<?php

// Stream wrappers
file_get_contents('file:///path/to/file');   // file://
file_get_contents('http://example.com');      // http://
file_get_contents('https://example.com');     // https://
file_get_contents('ftp://user:pass@host/');  // ftp://
$content = file_get_contents('php://input'); // raw POST body
$content = file_get_contents('php://stdin'); // CLI stdin

// php:// wrappers
// php://input     — raw request body (POST data as string)
// php://output    — write directly to output buffer
// php://memory    — read/write in-memory temp file
// php://temp      — like memory, but spills to disk if > 2MB
// php://stdin     — CLI: standard input
// php://stdout    — CLI: standard output
// php://stderr    — CLI: standard error
// php://fd/1      — specific file descriptor

// Stream context
$opts = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => json_encode(['key' => 'value']),
        'timeout' => 30,
    ],
];
$context = stream_context_create($opts);
$result = file_get_contents('https://api.example.com', false, $context);

// Custom stream wrapper registration
stream_wrapper_register('myscheme', 'MyStreamWrapper');
stream_wrapper_unregister('myscheme');
```

### 5.6 Security — Filters, Sanitisation & CSP

#### Input Filtering

```php
<?php

// filter_input — filter superglobal values
$id    = filter_input(INPUT_GET,  'id',    FILTER_VALIDATE_INT);
$email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
$url   = filter_input(INPUT_GET,  'url',   FILTER_VALIDATE_URL);
$ip    = filter_input(INPUT_SERVER, 'REMOTE_ADDR', FILTER_VALIDATE_IP);

// filter_var — filter arbitrary values
filter_var('42',           FILTER_VALIDATE_INT);     // 42 or false
filter_var('0',            FILTER_VALIDATE_BOOLEAN); // false (strict: "false"=false too)
filter_var('true',         FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE); // true
filter_var('abc@test.com', FILTER_VALIDATE_EMAIL);   // string or false
filter_var('not-an-email', FILTER_VALIDATE_EMAIL);   // false

// Sanitize filters (transform input)
filter_var('<script>alert(1)</script>', FILTER_SANITIZE_SPECIAL_CHARS);
// "&#60;script&#62;alert(1)&#60;/script&#62;"

filter_var('Hello World 123', FILTER_SANITIZE_NUMBER_INT);  // "123"
filter_var(' hello ', FILTER_SANITIZE_STRIPPED);            // "hello" (deprecated 8.1)

// INPUT_* constants
// INPUT_GET, INPUT_POST, INPUT_COOKIE, INPUT_SERVER, INPUT_ENV, INPUT_REQUEST
```

#### XSS Prevention

```php
<?php

// htmlspecialchars — THE primary XSS defense
$safe = htmlspecialchars($userInput, ENT_QUOTES | ENT_HTML5, 'UTF-8');
// ENT_QUOTES = convert both ' and "
// ENT_HTML5  = HTML5 named entities

// What htmlspecialchars converts:
// & -> &amp;
// < -> &lt;
// > -> &gt;
// " -> &quot;   (with ENT_QUOTES or ENT_COMPAT)
// ' -> &#039;   (with ENT_QUOTES)

// htmlentities — converts ALL applicable characters (not just 5 special)
// strip_tags — REMOVES HTML tags (not safe for security — use htmlspecialchars)

// For URLs
$safeUrl = rawurlencode($userInput);    // encode for URL path
$safeQuery = urlencode($userInput);     // encode for query string (space=+)
// rawurlencode: space = %20
// urlencode:    space = +
```

#### SQL Injection Prevention

```php
<?php

// PDO Prepared Statements — THE correct approach
$pdo = new PDO("mysql:host=localhost;dbname=mydb", $user, $pass, [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,  // use real prepared statements
]);

$stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id AND active = :active");
$stmt->execute([':id' => $id, ':active' => true]);
$user = $stmt->fetch();

// Positional placeholders
$stmt = $pdo->prepare("INSERT INTO logs (msg, level) VALUES (?, ?)");
$stmt->execute([$message, $level]);

// MySQLi prepared statements
$stmt = $mysqli->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);   // s=string, i=int, d=double, b=blob
$stmt->execute();
$result = $stmt->get_result();
```

**Exam focus:** `PDO::ATTR_EMULATE_PREPARES => false` forces real prepared statements at the database level (not just client-side escaping). This is the most secure configuration.

### 5.7 Cloud Config & Environment Variables

#### Environment Variables

```php
<?php

// Reading environment variables
$dbHost = getenv('DB_HOST');               // returns string or false
$dbHost = getenv('DB_HOST', true);         // true = local env only (not superglobal)
$dbHost = $_ENV['DB_HOST'] ?? 'localhost'; // via superglobal
$dbHost = $_SERVER['DB_HOST'] ?? null;     // also available here sometimes

// Setting (current process only, not persistent)
putenv('APP_ENV=production');

// PHP $_ENV population depends on:
// variables_order in php.ini (default: "EGPCS" = Env,Get,Post,Cookie,Server)

// .env file handling (via dotenv libraries like vlucas/phpdotenv)
// Best practice: never commit .env files, use .env.example as template
```

#### Cloud-Specific Patterns

```ini
; php.ini for containerized/cloud environments
; Disable file-based sessions in multi-instance deployments
session.save_handler = redis
session.save_path = "tcp://redis:6379"

; OPcache for containers (preload before serving)
opcache.enable = 1
opcache.memory_consumption = 256
opcache.max_accelerated_files = 20000
opcache.validate_timestamps = 0    ; DISABLE in production (requires deploy restart)
opcache.preload = /var/www/preload.php
opcache.preload_user = www-data

; Logging to stderr (cloud-native: logs go to stdout/stderr)
log_errors = On
error_log = /dev/stderr
display_errors = Off
```

**Exam focus:** In containerized/cloud environments, `opcache.validate_timestamps = 0` means PHP will NOT check if files changed. You **must** restart/reload FPM on deploy. Setting it to `1` in production causes performance degradation but allows hot-reload.

---

## 6. Section D — Plugin / Extension Order & Interactions

### 6.1 Extension Loading Order

```ini
; php.ini extension loading
; Order matters when extensions depend on each other

; 1. Core extensions (always loaded first)
; 2. Shared extensions via extension= directive (alphabetical by default, or explicit order)

extension=openssl     ; SSL/TLS support (must load before curl, smtp libs)
extension=curl        ; depends on openssl
extension=mbstring    ; multibyte string
extension=pdo
extension=pdo_mysql   ; depends on pdo (load pdo FIRST)
extension=pdo_pgsql
extension=redis       ; must load after php-redis PECL install
extension=xdebug      ; MUST be loaded LAST (hooks into engine)

; Zend extensions (different directive)
zend_extension=opcache.so   ; OPcache: must be Zend extension, not regular
zend_extension=xdebug.so    ; Xdebug: also Zend extension
```

**Exam focus:** `opcache` and `xdebug` are **Zend extensions** — they use `zend_extension=` directive, not `extension=`. Using the wrong directive causes them to fail silently or error. They must not run simultaneously in production (xdebug disables JIT).

#### Extension Interaction: OPcache + Xdebug

```
Production:
  [OPcache ON]  + [Xdebug OFF]  = Best performance
  [JIT ON]      + [Xdebug OFF]  = Maximum performance

Development:
  [OPcache OFF] + [Xdebug ON]   = Correct debugging (opcache can hide changes)
  [JIT OFF]     + [Xdebug ON]   = Required (Xdebug incompatible with JIT)

NEVER in Production:
  [Xdebug ON]   = Major performance penalty (~3x slower)
  [JIT ON]      + [Xdebug ON]  = Xdebug disables JIT automatically
```

### 6.2 Composer Autoloading & PSR Standards

#### PSR-4 Autoloading

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "src/",
            "App\\Tests\\": "tests/"
        },
        "psr-0": {
            "Legacy_": "lib/"
        },
        "classmap": [
            "src/legacy/OldClass.php"
        ],
        "files": [
            "src/helpers.php"
        ]
    },
    "autoload-dev": {
        "psr-4": {
            "App\\Tests\\": "tests/"
        }
    }
}
```

```
PSR-4 Mapping Logic:
  Namespace prefix: "App\"
  Base directory:   "src/"

  Class: App\Http\Controller\UserController
  File:  src/Http/Controller/UserController.php

  Class: App\Models\User
  File:  src/Models/User.php
```

**Exam focus:** PSR-4 class name must exactly match the file name (including case). Directory separator in namespace = `/` in file path. Namespace prefix maps to base directory; remainder of namespace maps to subdirectory path.

#### PSR Standards Summary

| PSR | Name | Key Rule |
|---|---|---|
| PSR-1 | Basic Coding Standard | Files use `<?php` or `<?=`; UTF-8; one class per file |
| PSR-2 | Coding Style (deprecated by PSR-12) | 4-space indent, LF line endings |
| PSR-3 | Logger Interface | `LoggerInterface` with 8 log levels |
| PSR-4 | Autoloader | Namespace-to-file mapping |
| PSR-6 | Caching Interface | `CacheItemPoolInterface`, `CacheItemInterface` |
| PSR-7 | HTTP Message Interface | `RequestInterface`, `ResponseInterface`, immutable |
| PSR-11 | Container Interface | `ContainerInterface` with `get()` and `has()` |
| PSR-12 | Extended Coding Style | Replaces PSR-2 |
| PSR-14 | Event Dispatcher | `EventDispatcherInterface`, `ListenerProviderInterface` |
| PSR-15 | HTTP Handlers | `RequestHandlerInterface`, `MiddlewareInterface` |
| PSR-16 | Simple Cache | `CacheInterface` (simpler than PSR-6) |
| PSR-17 | HTTP Factories | Factory interfaces for PSR-7 objects |
| PSR-18 | HTTP Client | `ClientInterface` |

**Exam focus:** PSR-3 log levels in descending severity: `emergency`, `alert`, `critical`, `error`, `warning`, `notice`, `info`, `debug`.

#### Composer Commands Reference

```bash
# Dependency management
composer require vendor/package              # install + add to composer.json
composer require vendor/package:^2.0         # specific version constraint
composer require --dev vendor/package        # dev dependency
composer remove vendor/package               # remove
composer update                              # update all (respecting constraints)
composer update vendor/package               # update specific
composer install                             # install from composer.lock (deploy)
composer install --no-dev                    # skip dev dependencies (production)

# Autoloading
composer dump-autoload                       # regenerate autoloader
composer dump-autoload --optimize            # classmap optimization (production)
composer dump-autoload -o                    # short form

# Information
composer show                                # list installed packages
composer show vendor/package                 # details
composer outdated                            # check for updates
composer validate                            # validate composer.json

# Version constraint syntax
"^2.0"      # >= 2.0.0 < 3.0.0  (caret: same major, any minor/patch update)
"~2.1"      # >= 2.1.0 < 3.0.0  (tilde on minor: next significant release from major 2.x — allows minor AND patch updates)
"~2.1.0"    # >= 2.1.0 < 2.2.0  (tilde on patch: patch updates only within 2.1.x)
"2.0.*"     # >= 2.0.0 < 2.1.0  (wildcard)
">=1.0 <2.0"# range
"1.0.0"     # exact version
```

> **Correction:** The `~2.1` tilde constraint allows **minor AND patch updates** within major 2.x (`>=2.1.0 <3.0.0`), NOT "patch updates only". The "patch updates only" behavior applies to `~2.1.0` (which constrains to `>=2.1.0 <2.2.0`). This is a common exam trap: `~Major.Minor` vs `~Major.Minor.Patch` behave differently.

**Exam focus:** `composer install` uses `composer.lock` (for reproducible builds on deploy). `composer update` ignores lock file and updates versions. **Always commit `composer.lock`**.

### 6.3 OPcache Configuration

```ini
; /etc/php/8.2/fpm/php.ini
zend_extension=opcache

[opcache]
opcache.enable=1
opcache.enable_cli=0                   ; usually off for CLI (unless using preload)
opcache.memory_consumption=256         ; MB of shared memory
opcache.interned_strings_buffer=16     ; MB for interned strings
opcache.max_accelerated_files=20000    ; max files in cache (increase for large apps)
opcache.revalidate_freq=60             ; seconds between stat checks (when validate_timestamps=1)
opcache.validate_timestamps=1          ; 1=dev (check file changes), 0=prod (never check)
opcache.save_comments=1                ; keep docblocks (needed for Doctrine/Annotations)
opcache.fast_shutdown=1                ; faster shutdown

; Preloading (PHP 7.4+)
opcache.preload=/var/www/preload.php   ; script to preload classes/functions
opcache.preload_user=www-data          ; user to run preload under

; JIT (PHP 8.0+)
opcache.jit=tracing                    ; tracing|function|on|off
opcache.jit_buffer_size=128M           ; 0 disables JIT
```

#### OPcache Management Functions

```php
<?php

opcache_get_status();                  // array of cache statistics
opcache_get_configuration();           // current configuration
opcache_reset();                       // clear entire cache (returns bool)
opcache_invalidate('/path/to/file.php'); // invalidate single file
opcache_invalidate('/path/to/file.php', true); // force recompile
opcache_compile_file('/path/to/file.php'); // pre-compile a file
opcache_is_script_cached('/path/to/file.php'); // check if cached
```

**Exam focus:** `opcache_reset()` in a web request only resets the cache for the current FPM worker process. To reset across all workers, you need to restart/reload PHP-FPM or use a dedicated cache-clearing strategy.

### 6.4 Xdebug & Profiling Extensions

#### Xdebug Configuration

```ini
zend_extension=xdebug

[xdebug]
; Xdebug 3.x configuration (completely different from 2.x!)
xdebug.mode=debug                      ; off|develop|coverage|debug|gcstats|profile|trace
; Multiple modes: xdebug.mode=debug,coverage

xdebug.start_with_request=yes          ; always start debugging
xdebug.start_with_request=trigger      ; start only with XDEBUG_TRIGGER cookie/env

; Step debugger
xdebug.client_host=127.0.0.1
xdebug.client_port=9003                ; Xdebug 3 default (was 9000 in v2!)
xdebug.idekey=PHPSTORM

; Profiling
xdebug.mode=profile
xdebug.output_dir=/tmp/xdebug
xdebug.profiler_output_name=cachegrind.out.%p  ; %p=PID, %t=timestamp, %H=host

; Coverage
xdebug.mode=coverage
```

**Exam focus:** Xdebug 3 uses `xdebug.mode` (single directive for all features). Default port changed from **9000** (v2) to **9003** (v3). Setting `xdebug.mode=off` completely disables it (much better than uninstalling for toggling).

---

## 7. High-Frequency Traps & Common Wrong Answers

### The PHP 8 Behavior Changes Trap List

```php
<?php

// 1. String-to-int comparison (CHANGED IN PHP 8)
0 == "foo"      // PHP 7: true  | PHP 8: FALSE
0 == ""         // PHP 7: true  | PHP 8: FALSE
0 == "0"        // PHP 7: true  | PHP 8: true  (still true - "0" is numeric)

// 2. match is strict, switch is loose
switch (0) { case false: echo "yes"; }  // echoes "yes" (0 == false)
match (0) { false => "yes" }            // throws UnhandledMatchError (0 !== false)

// 3. Ternary associativity removed
// $a = $b ? $c : $d ? $e : $f;  // Deprecated in 7.4, Fatal in 8.0
// Use explicit parentheses: ($b ? $c : $d) ? $e : $f

// 4. Nullsafe short-circuit
$result = null?->method()?->otherMethod();  // null, otherMethod not called

// 5. Union types accept null only via |null or ?
function f(int|null $x) {}   // OK
function g(?int $x) {}       // OK
function h(int $x = null) {} // Deprecated — add ?int

// 6. Array unpacking with string keys
$a = ['x' => 1]; $b = ['x' => 2]; $c = [...$a, ...$b]; // ['x' => 2] — PHP 8.1+ only

// 7. Static return type
class A { public function clone(): static { return new static(); } }
class B extends A {}
(new B)->clone(); // returns B, not A

// 8. never return type
function alwaysThrows(): never { throw new Exception(); } // OK
function returnsNull(): never { return null; }  // FATAL — can't return from never

// 9. Intersection types require ALL types to match
function f(Countable&Iterator $x) {}  // $x must be BOTH Countable AND Iterator

// 10. Readonly can only be initialized once
class C { public readonly int $x; }
$c = new C(); $c->x = 1; $c->x = 2; // Fatal on second assignment
```

### The Classic PHP Traps

```php
<?php

// 11. Array reference in foreach
$arr = [1, 2, 3];
foreach ($arr as &$v) { $v *= 2; }
// $arr = [2, 4, 6] BUT $v still references $arr[2]
foreach ($arr as $v) { }  // destroys $arr[2] on final iteration!
// $arr = [2, 4, 4]  ← last element duplicated!
// FIX: unset($v) after first foreach

// 12. strpos returns 0 is NOT false
if (strpos("hello", "h")) { }    // WRONG: 0 is falsy!
if (strpos("hello", "h") !== false) { }  // CORRECT

// 13. count() on null
count(null);  // PHP 7.2+: E_WARNING, returns 0

// 14. Integer division truncates
intdiv(7, 2);   // 3 (NOT 3.5)
7 / 2;          // 3.5 (float)
(int)(7/2);     // 3 (truncates toward zero)

// 15. Loose comparison of arrays
[] == false;    // true
[] == null;     // true
[] == 0;        // false (!)

// 16. list() / [] assignment
[$a, $b] = [1, 2];        // $a=1, $b=2
[, $b] = [1, 2];          // $b=2 (skip first)
['key' => $v] = ['key' => 42, 'x' => 99]; // $v=42

// 17. include vs require
// include: E_WARNING on failure, script continues
// require: E_ERROR on failure, script stops
// include_once / require_once: only include if not already included (track by path)

// 18. Static variables in methods
class Counter {
    public function increment() {
        static $n = 0;
        return ++$n;
    }
}
$c1 = new Counter(); $c2 = new Counter();
$c1->increment();  // 1
$c1->increment();  // 2
$c2->increment();  // 3 (static = per method definition, NOT per instance!)

// 19. Object cloning is shallow
class Node { public ?Node $next = null; }
$a = new Node(); $a->next = new Node();
$b = clone $a;
$b->next === $a->next;  // TRUE — same object! (shallow clone)
// Fix: implement __clone() to deep-clone $this->next

// 20. Heredoc/Nowdoc
$name = "World";
$heredoc = <<<EOT
    Hello $name   // variables interpolated
EOT;

$nowdoc = <<<'EOT'
    Hello $name   // NO interpolation — literal $name
EOT;
// PHP 7.3+: closing marker can be indented (base indentation stripped)
```

---

## 8. Error Pattern Diagnostic Matrix

Use this matrix immediately after your simulation. For each wrong answer, find the most specific matching row and increment that section's tally.

```
+------------------------------------------+----------+--------------------+
| Error Pattern Description                | Section  | Priority Action    |
+------------------------------------------+----------+--------------------+
| PHP 8 type juggling (0 == "str")         | 3.1      | Memorize PHP8 diffs|
| Casting: (bool)"0" or (int)1.9           | 3.1      | Review cast table  |
| Operator precedence (and/or vs &&/||)    | 3.2      | Memorize table     |
| ?? vs ?: behavior                        | 3.2      | Practice examples  |
| match strict vs switch loose             | 3.3      | Do side-by-side    |
| UnhandledMatchError (no default)         | 3.3      | Add to flashcard   |
| Arrow fn vs closure capture              | 3.4      | Write 5 examples   |
| self:: vs static:: (LSB)                 | 3.7      | Trace through code |
| array_filter key preservation            | 3.5      | Memorize behavior  |
| array_merge vs + operator                | 3.5      | Memorize both      |
| strpos returns 0 not false               | 3.6      | Memorize !==false  |
| finally() overrides return               | 3.8      | Run mental trace   |
| Throwable vs Error vs Exception          | 3.8      | Learn hierarchy    |
| LogicException vs RuntimeException SPL   | 3.8      | Learn which extends which |
| Generator yield/send flow               | 3.9      | Trace through      |
+------------------------------------------+----------+--------------------+
| never vs void return types               | 4.1      | Review definitions |
| readonly initialization rules            | 4.3      | List all rules     |
| JIT requires OPcache                     | 4.4      | Memorize dep chain |
| nullsafe chain short-circuit             | 4.5      | Trace examples     |
| str_contains("x","") returns true        | 4.6      | Memorize edge case |
| mb_strlen vs strlen bytes/chars          | 4.6      | Test both          |
| DateTimeImmutable returns new obj        | 4.7      | Compare APIs       |
| Named args order rules                   | 4.2      | Practice           |
+------------------------------------------+----------+--------------------+
| memory_limit >= post_max_size hierarchy  | 5.1      | Memorize order     |
| PHP_INI_SYSTEM vs PHP_INI_ALL            | 5.1      | Learn categories   |
| session_regenerate_id on login           | 5.3      | Security pattern   |
| SameSite cookie rules                    | 5.3      | Learn each option  |
| headers_sent + output buffering          | 5.4      | Understand flow    |
| never trust $_FILES['type']              | 5.5      | Security rule      |
| is_uploaded_file required                | 5.5      | Security rule      |
| opcache.validate_timestamps cloud        | 5.7      | Cloud deploy rule  |
| PDO::ATTR_EMULATE_PREPARES = false       | 5.6      | Security config    |
+------------------------------------------+----------+--------------------+
| extension= vs zend_extension=            | 6.1      | Memorize both types|
| OPcache + Xdebug incompatibility         | 6.1      | Memorize rule      |
| Xdebug 3 port 9003 (not 9000)           | 6.4      | Memorize version   |
| PSR-4 namespace to file mapping          | 6.2      | Practice mapping   |
| composer install vs update               | 6.2      | Memorize diff      |
| ~ vs ^ composer version constraints      | 6.2      | Memorize semantics |
| ~2.1 allows minor updates (not patch only)| 6.2     | Know ~Min vs ~Min.Patch |
| opcache_reset() per-worker scope         | 6.3      | Understand scope   |
| PSR-3 log level order                    | 6.2      | Memorize order     |
+------------------------------------------+----------+--------------------+
```

### Post-Simulation Scoring Worksheet

```
DATE: ___________
TOTAL SCORE: _____ / 60 = _____%

SECTION BREAKDOWN:
  Section A (PHP Core):     _____ / 25 = _____%  [Target: >=70%]
  Section B (EE Features):  _____ / 20 = _____%  [Target: >=70%]
  Section C (Web/Cloud):    _____ / 15 = _____%  [Target: >=70%]

PRIORITY RANKING (circle lowest %):
  Priority 1 (LOWEST):  A / B / C  — Study intensively for 3 days
  Priority 2 (MIDDLE):  A / B / C  — Study 1 full day
  Priority 3 (HIGHEST): A / B / C  — Quick 1-hour refresh only

ERROR PATTERN TALLY (from matrix above):
  Type Juggling errors:      _____
  EE Feature errors:         _____
  Config errors:             _____
  Plugin/Extension errors:   _____
  OOP errors:                _____
  Array/String errors:       _____
  Security errors:           _____

TOP 3 SPECIFIC WEAK AREAS:
  1. _______________________________________
  2. _______________________________________
  3. _______________________________________

NEXT STEPS:
  Day 1: ____________________________________
  Day 2: ____________________________________
  Day 3: ____________________________________
```

---

## 9. Quick-Reference Checklist

### PHP Language Core

- [ ] `0 == "non-numeric-string"` → **`false` in PHP 8** (was `true` in PHP 7)
- [ ] `(bool)"0"` → `false` (the only non-empty string that is falsy)
- [ ] `(int)1.9` → `1` (truncates, never rounds)
- [ ] `and`/`or` have **lower** precedence than `=`; `&&`/`||` have higher
- [ ] `??` checks for null/undefined; `?:` checks for falsy; `0 ?? "x"` returns `0`
- [ ] `??=` assigns only if current value is null
- [ ] `match` uses strict (`===`) comparison; `switch` uses loose (`==`)
- [ ] `match` without `default` throws `UnhandledMatchError` on no match
- [ ] `match` returns a value; `switch` does not
- [ ] `foreach (&$val)` — always `unset($val)` afterwards
- [ ] Arrow functions (`fn`) capture outer scope **automatically by value**; closures need explicit `use`
- [ ] `array_filter()` **preserves keys** — use `array_values()` to reindex
- [ ] `array_merge()` with numeric keys **reindexes**; `+` operator keeps first occurrence
- [ ] `strpos()` returns `false` (not `-1`) when not found — always use `!== false`
- [ ] `self::` = definition-time class; `static::` = call-time class (Late Static Binding)
- [ ] Trait conflicts: `insteadof` selects winner; `as` creates alias; class method wins over trait
- [ ] Enum `from()` throws `ValueError`; `tryFrom()` returns `null`
- [ ] `finally` always executes; a `finally` `return` overrides try/catch `return`
- [ ] `Throwable` catches both `Error` and `Exception`; catch order matters (specific before general)
- [ ] `__get`/`__set` only trigger for **inaccessible** properties
- [ ] Generator `yield from` captures the inner generator's `return` value
- [ ] Fibers use `Fiber::suspend()` (static); generators use `yield`
- [ ] SPL exception hierarchy: `LogicException` children = `BadFunctionCallException`, `DomainException`, `InvalidArgumentException`, `LengthException`, `OutOfRangeException`
- [ ] SPL exception hierarchy: `RuntimeException` children = `OutOfBoundsException`, `OverflowException`, `RangeException`, `UnderflowException`, `UnexpectedValueException`

### Extended Engine Features

- [ ] `never` return type = function must throw or exit, **never returns normally**
- [ ] `void` return type = can `return;` but not `return value;`
- [ ] `readonly` property: set once (in constructor), immutable after; not for `static` properties
- [ ] PHP 8.2 `readonly` classes: all properties implicitly readonly
- [ ] JIT requires `opcache.enable=1`; set via `opcache.jit` and `opcache.jit_buffer_size`
- [ ] Named arguments: positional must precede named; named cannot be duplicated
- [ ] `str_contains("x", "")` → `true`; same for `str_starts_with` and `str_ends_with` with empty needle
- [ ] `mb_strlen()` counts characters; `strlen()` counts bytes
- [ ] `DateTimeImmutable::modify()` returns **new object**; `DateTime::modify()` modifies in place
- [ ] Covariance: return types can be narrowed in subclasses
- [ ] Contravariance: parameter types can be widened in subclasses
- [ ] Nullsafe `?->` short-circuits at first `null` — rest of chain not evaluated
- [ ] PHP 8.1 `Fibers`: independent execution stacks; `Fiber::suspend()` passes value out
- [ ] Attributes use `#[Attribute]` annotation; read via `ReflectionX::getAttributes()`
- [ ] `Attribute::IS_REPEATABLE` allows multiple instances of same attribute on one target

### Web & Cloud Configuration

- [ ] Size hierarchy: `memory_limit` ≥ `post_max_size` ≥ `upload_max_filesize`
- [ ] `PHP_INI_SYSTEM` directives (e.g., `disable_functions`, `open_basedir`) cannot be changed with `ini_set()`
- [ ] `opcache.validate_timestamps=0` in production; must restart FPM on deploy
- [ ] `session_regenerate_id(true)` after successful login (prevents session fixation)
- [ ] `SameSite=None` requires `Secure=true`
- [ ] `SameSite=Strict` blocks cookie on ALL cross-site requests
- [ ] `SameSite=Lax` allows top-level GET navigation
- [ ] Headers must be sent before any output (output buffering delays actual output)
- [ ] `headers_sent()` returns `true` if even one byte sent to browser
- [ ] After `Location:` redirect header, always call `exit;` or `die;`
- [ ] Never trust `$_FILES['type']` — use `finfo_file()` for MIME validation
- [ ] Always call `is_uploaded_file()` before processing an upload
- [ ] `PDO::ATTR_EMULATE_PREPARES => false` = real prepared statements (not client-side)
- [ ] `htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8')` is the correct XSS escape
- [ ] `php://input` = raw POST body; `php://memory` = in-memory temp file
- [ ] `session.use_only_cookies=1` prevents session ID from appearing in URL
- [ ] `expose_php=Off` hides PHP version from `X-Powered-By` header
- [ ] `allow_url_include=Off` (security — must stay off in production)

### Plugin / Extension Order & Interactions

- [ ] `opcache` and `xdebug` use `zend_extension=` (not `extension=`)
- [ ] Load order: `pdo` before `pdo_mysql`; `openssl` before `curl`
- [ ] Xdebug disables JIT automatically; never run both in production
- [ ] Xdebug 3 default port = **9003** (was 9000 in v2)
- [ ] Xdebug 3 controlled by `xdebug.mode` (single directive): `off|develop|coverage|debug|profile|trace`
- [ ] `opcache_reset()` affects only current FPM worker — not all workers
- [ ] PSR-4: class file path must exactly match namespace hierarchy (case-sensitive)
- [ ] `composer install` = uses lock file (deploy); `composer update` = ignores lock file (upgrade)
- [ ] `composer dump-autoload -o` generates optimized classmap for production
- [ ] `^2.0` = `>=2.0.0 <3.0.0`; `~2.1` = `>=2.1.0 <3.0.0` (minor+patch); `~2.1.0` = `>=2.1.0 <2.2.0` (patch only)
- [ ] PSR-3 log levels (high→low): `emergency` > `alert` > `critical` > `error` > `warning` > `notice` > `info` > `debug`
- [ ] OPcache `pm` modes: `static` (fixed children), `dynamic` (variable), `ondemand` (spawn per request)
- [ ] `opcache.save_comments=1` required for annotation-based frameworks (Doctrine, etc.)
- [ ] `opcache.preload` requires `opcache.preload_user` to be set (security requirement)
- [ ] Always commit `composer.lock`; never commit `.env`

---

*Last updated: May 2 — Full Simulation Reference v4. Cross-reference every wrong answer against Section 8 diagnostic matrix for targeted remediation.*
