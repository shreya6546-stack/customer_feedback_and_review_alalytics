/**
 * Vercel Serverless Function - Catch-All API Entrypoint
 * Handles requests to /api/*
 */

const { handleRequest } = require('../server/index');

module.exports = async (req, res) => {
  return handleRequest(req, res);
};
