# SQL Server + Entity Framework Setup

## Overview

Set up Entity Framework ORM with SQL Server database.

## Requirements

- Use Entity Framework + SQL Server
- Create initial schema based on data models in project-overview.md (this will evolve)
- Include/Extend Duende identity setup models mapping with model User in project-overview.md (this will evolve) 
- Add appropriate indexes and cascade deletes
- Setup appropriate containers and make sure them stay connected, up and running via docker compose, including webapp UI

## References

- Initial data models: `@context/project-overview.md`
- Database standards: `@context/coding-standards.md`
- Fetch latest Entity Framework latest docs before implementation

## Notes

We will have a development branch that we work on that will be in DATABASE_URL and then we will have a production branch. So we ALWAYS create migrations and never push directly unless specified.
