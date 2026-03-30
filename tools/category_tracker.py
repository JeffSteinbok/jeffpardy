#!/usr/bin/env python3
"""
Jeffpardy Category Tracker

Scans game files and maintains a CSV of all categories used across games.
Supports incremental updates and duplicate detection for new game files.
"""

import argparse
import csv
import json
import os
import sys
from pathlib import Path

_ONEDRIVE = os.environ.get("OneDrive", os.path.join(os.path.expanduser("~"), "OneDrive"))
DEFAULT_GAMES_FOLDER = os.path.join(_ONEDRIVE, "JeffPardy", "Games")
DEFAULT_CSV_PATH = os.path.join(_ONEDRIVE, "JeffPardy", "used_categories.csv")

CSV_FIELDS = ["category", "air_date", "game_file", "round"]


def load_csv(csv_path: str) -> list[dict]:
    """Load existing CSV rows, or return empty list if file doesn't exist."""
    if not os.path.exists(csv_path):
        return []
    with open(csv_path, "r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def save_csv(csv_path: str, rows: list[dict]):
    """Write all rows to CSV."""
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def get_tracked_game_files(rows: list[dict]) -> set[str]:
    """Return the set of game filenames already in the CSV."""
    return {row["game_file"] for row in rows}


def extract_categories(game_path: str) -> list[dict]:
    """Extract all categories from a game JSON file."""
    with open(game_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    game_file = os.path.basename(game_path)
    categories = []

    for rnd in data.get("rounds", []):
        round_label = f"Round {rnd.get('id', 0) + 1}"
        for cat in rnd.get("categories", []):
            categories.append({
                "category": cat.get("title", ""),
                "air_date": cat.get("airDate", ""),
                "game_file": game_file,
                "round": round_label,
            })

    final = data.get("finalJeffpardyCategory")
    if final:
        categories.append({
            "category": final.get("title", ""),
            "air_date": final.get("airDate", ""),
            "game_file": game_file,
            "round": "Final",
        })

    return categories


def get_game_files(games_folder: str) -> list[str]:
    """Get all .json and .txt game files in the folder (not subfolders)."""
    result = []
    for name in sorted(os.listdir(games_folder)):
        if name.lower().endswith((".json", ".txt")):
            result.append(os.path.join(games_folder, name))
    return result


def cmd_update(args):
    """Scan games folder and add any new game files to the CSV."""
    games_folder = args.games_folder
    csv_path = args.csv

    if not os.path.isdir(games_folder):
        print(f"Error: Games folder not found: {games_folder}")
        sys.exit(1)

    existing_rows = load_csv(csv_path)
    tracked = get_tracked_game_files(existing_rows)
    game_files = get_game_files(games_folder)

    new_count = 0
    new_rows = []
    for gf in game_files:
        name = os.path.basename(gf)
        if name not in tracked:
            try:
                cats = extract_categories(gf)
                new_rows.extend(cats)
                new_count += 1
                print(f"  + {name} ({len(cats)} categories)")
            except (json.JSONDecodeError, KeyError) as e:
                print(f"  ! Skipping {name}: {e}")

    if new_count == 0:
        print(f"CSV is up to date. {len(tracked)} game files already tracked.")
    else:
        all_rows = existing_rows + new_rows
        save_csv(csv_path, all_rows)
        total_games = len(tracked) + new_count
        print(f"\nAdded {new_count} new game file(s) ({len(new_rows)} categories).")
        print(f"Total: {total_games} game files, {len(all_rows)} categories in {csv_path}")


def cmd_check(args):
    """Check a game file for duplicate categories against the tracked list."""
    file_path = args.file
    csv_path = args.csv

    if not os.path.isfile(file_path):
        print(f"Error: File not found: {file_path}")
        sys.exit(1)

    existing_rows = load_csv(csv_path)
    game_name = os.path.basename(file_path)

    # Build lookup, excluding rows from this same game file
    existing_categories: dict[str, list[dict]] = {}
    for row in existing_rows:
        if row["game_file"] == game_name:
            continue
        key = row["category"].strip().upper()
        existing_categories.setdefault(key, []).append(row)

    try:
        new_cats = extract_categories(file_path)
    except (json.JSONDecodeError, KeyError) as e:
        print(f"Error reading {file_path}: {e}")
        sys.exit(1)

    print(f"Checking {game_name}: {len(new_cats)} categories\n")

    dupes_found = []
    for cat in new_cats:
        key = cat["category"].strip().upper()
        if key in existing_categories:
            dupes_found.append((cat, existing_categories[key]))

    if not dupes_found:
        print("No duplicate categories found!")
    else:
        print(f"Found {len(dupes_found)} duplicate(s):\n")
        for new_cat, prev_uses in dupes_found:
            print(f'  "{new_cat["category"]}" ({new_cat["round"]})')
            for prev in prev_uses:
                print(f'    Previously used in: {prev["game_file"]} ({prev["round"]})')
        print()

    if args.yes:
        do_add = True
    else:
        answer = input(f"Add {game_name} to the used categories list? [y/N] ").strip().lower()
        do_add = answer == "y"

    if do_add:
        all_rows = existing_rows + new_cats
        save_csv(csv_path, all_rows)
        print(f"Added {game_name} ({len(new_cats)} categories) to {csv_path}")
    else:
        print("Not added.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="category_tracker",
        description="Jeffpardy Category Tracker — track which categories have been used across games.",
        epilog=(
            "examples:\n"
            "  %(prog)s update                          Scan default games folder, add new files to CSV\n"
            "  %(prog)s update --games-folder ./Games    Use a custom games folder\n"
            '  %(prog)s check "2026-03-29-1.json"        Check a file for duplicates and optionally add it\n'
            "  %(prog)s check game.json --yes             Add without prompting\n"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--games-folder",
        default=DEFAULT_GAMES_FOLDER,
        metavar="PATH",
        help=f"path to games folder (default: {DEFAULT_GAMES_FOLDER})",
    )
    parser.add_argument(
        "--csv",
        default=DEFAULT_CSV_PATH,
        metavar="PATH",
        help=f"path to output CSV (default: {DEFAULT_CSV_PATH})",
    )

    subparsers = parser.add_subparsers(dest="command", title="commands", metavar="<command>")

    update_parser = subparsers.add_parser(
        "update",
        help="scan games folder and add new game files to the CSV",
        description="Walk the games folder, find any game files not already in the CSV, and append their categories.",
    )
    update_parser.set_defaults(func=cmd_update)

    check_parser = subparsers.add_parser(
        "check",
        help="check a game file for duplicate categories",
        description=(
            "Parse a game file, compare its categories against the CSV, report duplicates, "
            "and optionally add it to the tracked list."
        ),
    )
    check_parser.add_argument("file", help="path to the game file to check")
    check_parser.add_argument(
        "-y",
        "--yes",
        action="store_true",
        help="add the game to the CSV without prompting",
    )
    check_parser.set_defaults(func=cmd_check)

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == "__main__":
    main()
