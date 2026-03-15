#!/bin/bash
echo "Initiating Vercel Rollback..."
vercel rollback --yes
echo "Rollback completed."
