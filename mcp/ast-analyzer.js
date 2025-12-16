/**
 * AST Analyzer - Deep code analysis using Abstract Syntax Trees
 * Supports: PHP (current), Java, C#, Python, JavaScript (future)
 * 
 * Extracts:
 * - Complex validations (nested if/switch)
 * - Exact calculation formulas
 * - Error handling patterns
 * - State transitions
 * - Function dependencies
 */

import { Engine } from 'php-parser';

/**
 * Base class for language-specific AST analyzers
 */
class ASTAnalyzer {
  constructor(language) {
    this.language = language;
  }

  analyze(code) {
    throw new Error('analyze() must be implemented by subclass');
  }
}

/**
 * PHP AST Analyzer using php-parser
 */
class PHPASTAnalyzer extends ASTAnalyzer {
  constructor() {
    super('php');
    this.parser = new Engine({
      parser: {
        extractDoc: true,
        php7: true,
        suppressErrors: true
      },
      ast: {
        withPositions: true
      }
    });
  }

  /**
   * Main analysis entry point
   */
  analyze(code) {
    try {
      const ast = this.parser.parseCode(code);
      
      return {
        validations: this.extractValidations(ast),
        calculations: this.extractCalculations(ast),
        error_handling: this.extractErrorHandling(ast),
        state_transitions: this.extractStateTransitions(ast),
        function_calls: this.extractFunctionCalls(ast),
        variable_assignments: this.extractVariableAssignments(ast)
      };
    } catch (error) {
      console.error(`[AST] Parse error: ${error.message}`);
      return {
        validations: [],
        calculations: [],
        error_handling: [],
        state_transitions: [],
        function_calls: [],
        variable_assignments: [],
        parse_error: error.message
      };
    }
  }

  /**
   * Extract all validation logic (if/switch with conditions)
   */
  extractValidations(ast) {
    const validations = [];
    
    this.traverse(ast, (node) => {
      // IF statements with complex conditions
      if (node.kind === 'if') {
        const condition = this.nodeToString(node.test);
        const thenBlock = this.extractBlockDescription(node.body);
        const elseBlock = node.alternate ? this.extractBlockDescription(node.alternate) : null;
        
        validations.push({
          type: 'if',
          condition: condition,
          then: thenBlock,
          else: elseBlock,
          line: node.loc?.start?.line || 0,
          complexity: this.calculateComplexity(node.test)
        });
      }
      
      // SWITCH statements
      if (node.kind === 'switch') {
        const discriminant = this.nodeToString(node.test);
        const cases = [];
        
        if (node.body && node.body.children) {
          for (const caseNode of node.body.children) {
            if (caseNode.kind === 'case') {
              cases.push({
                value: caseNode.test ? this.nodeToString(caseNode.test) : 'default',
                action: this.extractBlockDescription(caseNode.body)
              });
            }
          }
        }
        
        validations.push({
          type: 'switch',
          discriminant: discriminant,
          cases: cases,
          line: node.loc?.start?.line || 0
        });
      }
    });
    
    return validations;
  }

  /**
   * Extract calculation formulas and assignments
   */
  extractCalculations(ast) {
    const calculations = [];
    
    this.traverse(ast, (node) => {
      // Variable assignments with arithmetic operations
      if (node.kind === 'assign' && node.right) {
        const leftVar = this.nodeToString(node.left);
        const rightExpr = this.nodeToString(node.right);
        
        // Only capture if it contains arithmetic or function calls
        if (this.isCalculation(node.right)) {
          calculations.push({
            variable: leftVar,
            formula: rightExpr,
            line: node.loc?.start?.line || 0,
            operations: this.extractOperations(node.right)
          });
        }
      }
    });
    
    return calculations;
  }

  /**
   * Extract error handling (try/catch/throw)
   */
  extractErrorHandling(ast) {
    const errorHandling = [];
    
    this.traverse(ast, (node) => {
      // TRY-CATCH blocks
      if (node.kind === 'try') {
        const tryBlock = this.extractBlockDescription(node.body);
        const catches = [];
        
        if (node.catches) {
          for (const catchNode of node.catches) {
            catches.push({
              exception_type: catchNode.what ? this.nodeToString(catchNode.what) : 'Exception',
              variable: catchNode.variable ? catchNode.variable.name : 'e',
              handler: this.extractBlockDescription(catchNode.body)
            });
          }
        }
        
        errorHandling.push({
          type: 'try-catch',
          try_block: tryBlock,
          catches: catches,
          line: node.loc?.start?.line || 0
        });
      }
      
      // THROW statements
      if (node.kind === 'throw') {
        errorHandling.push({
          type: 'throw',
          exception: this.nodeToString(node.what),
          line: node.loc?.start?.line || 0
        });
      }
    });
    
    return errorHandling;
  }

  /**
   * Extract state transitions (status changes, workflow)
   */
  extractStateTransitions(ast) {
    const transitions = [];
    
    this.traverse(ast, (node) => {
      // Look for assignments to state/status/estado fields
      if (node.kind === 'assign') {
        const leftVar = this.nodeToString(node.left);
        
        if (/estado|status|state|workflow/i.test(leftVar)) {
          const newValue = this.nodeToString(node.right);
          
          transitions.push({
            field: leftVar,
            new_value: newValue,
            line: node.loc?.start?.line || 0
          });
        }
      }
    });
    
    return transitions;
  }

  /**
   * Extract all function/method calls
   */
  extractFunctionCalls(ast) {
    const calls = [];
    
    this.traverse(ast, (node) => {
      if (node.kind === 'call') {
        const funcName = this.nodeToString(node.what);
        const args = node.arguments ? node.arguments.map(arg => this.nodeToString(arg)) : [];
        
        calls.push({
          function: funcName,
          arguments: args,
          line: node.loc?.start?.line || 0
        });
      }
    });
    
    return calls;
  }

  /**
   * Extract variable assignments for data flow analysis
   */
  extractVariableAssignments(ast) {
    const assignments = [];
    
    this.traverse(ast, (node) => {
      if (node.kind === 'assign') {
        assignments.push({
          variable: this.nodeToString(node.left),
          value: this.nodeToString(node.right),
          line: node.loc?.start?.line || 0
        });
      }
    });
    
    return assignments;
  }

  /**
   * Traverse AST and apply callback to each node
   */
  traverse(node, callback) {
    if (!node || typeof node !== 'object') return;
    
    callback(node);
    
    // Traverse children
    for (const key in node) {
      if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
      
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(item => this.traverse(item, callback));
      } else if (typeof child === 'object') {
        this.traverse(child, callback);
      }
    }
  }

  /**
   * Convert AST node to readable string
   */
  nodeToString(node) {
    if (!node) return '';
    
    switch (node.kind) {
      case 'variable':
        return '$' + (node.name || '');
      
      case 'string':
        return `"${node.value || ''}"`;
      
      case 'number':
        return String(node.value || 0);
      
      case 'boolean':
        return node.value ? 'true' : 'false';
      
      case 'bin':
        return `${this.nodeToString(node.left)} ${node.type} ${this.nodeToString(node.right)}`;
      
      case 'unary':
        return `${node.type}${this.nodeToString(node.what)}`;
      
      case 'call':
        const funcName = this.nodeToString(node.what);
        const args = node.arguments ? node.arguments.map(arg => this.nodeToString(arg)).join(', ') : '';
        return `${funcName}(${args})`;
      
      case 'propertylookup':
      case 'offsetlookup':
        return `${this.nodeToString(node.what)}[${this.nodeToString(node.offset)}]`;
      
      case 'staticlookup':
        return `${this.nodeToString(node.what)}::${this.nodeToString(node.offset)}`;
      
      case 'isset':
        return `isset(${node.variables.map(v => this.nodeToString(v)).join(', ')})`;
      
      case 'empty':
        return `empty(${this.nodeToString(node.expression)})`;
      
      case 'cast':
        return `(${node.type})${this.nodeToString(node.what)}`;
      
      case 'array':
        if (node.items && node.items.length > 0) {
          return `[${node.items.map(item => {
            if (item.kind === 'entry') {
              return item.key ? `${this.nodeToString(item.key)} => ${this.nodeToString(item.value)}` : this.nodeToString(item.value);
            }
            return this.nodeToString(item);
          }).join(', ')}]`;
        }
        return '[]';
      
      default:
        if (node.name) return node.name;
        if (node.value !== undefined) return String(node.value);
        return `[${node.kind}]`;
    }
  }

  /**
   * Extract block description (action summary)
   */
  extractBlockDescription(body) {
    if (!body) return '';
    
    const statements = [];
    const bodyArray = Array.isArray(body) ? body : (body.children || [body]);
    
    for (const stmt of bodyArray.slice(0, 5)) { // First 5 statements
      if (stmt.kind === 'return') {
        statements.push(`return ${this.nodeToString(stmt.expr)}`);
      } else if (stmt.kind === 'call') {
        statements.push(this.nodeToString(stmt));
      } else if (stmt.kind === 'assign') {
        statements.push(`${this.nodeToString(stmt.left)} = ${this.nodeToString(stmt.right)}`);
      } else if (stmt.kind === 'throw') {
        statements.push(`throw ${this.nodeToString(stmt.what)}`);
      }
    }
    
    if (bodyArray.length > 5) {
      statements.push(`... (${bodyArray.length - 5} more statements)`);
    }
    
    return statements.join('; ');
  }

  /**
   * Calculate condition complexity (number of logical operators)
   */
  calculateComplexity(node) {
    let complexity = 0;
    
    this.traverse(node, (n) => {
      if (n.kind === 'bin' && ['&&', '||', 'and', 'or'].includes(n.type)) {
        complexity++;
      }
    });
    
    return complexity;
  }

  /**
   * Check if expression is a calculation
   */
  isCalculation(node) {
    if (!node) return false;
    
    if (node.kind === 'bin' && ['+', '-', '*', '/', '%', '**'].includes(node.type)) {
      return true;
    }
    
    if (node.kind === 'call') {
      const funcName = this.nodeToString(node.what);
      return /round|floor|ceil|abs|pow|sqrt|sum|avg|count/i.test(funcName);
    }
    
    return false;
  }

  /**
   * Extract arithmetic operations from expression
   */
  extractOperations(node) {
    const ops = [];
    
    this.traverse(node, (n) => {
      if (n.kind === 'bin' && ['+', '-', '*', '/', '%', '**'].includes(n.type)) {
        ops.push(n.type);
      }
    });
    
    return [...new Set(ops)];
  }
}

/**
 * Factory to create language-specific analyzers
 */
export function createASTAnalyzer(language) {
  switch (language.toLowerCase()) {
    case 'php':
      return new PHPASTAnalyzer();
    
    case 'java':
      // TODO: Implement JavaASTAnalyzer using java-parser
      throw new Error('Java AST analyzer not yet implemented');
    
    case 'csharp':
    case 'c#':
      // TODO: Implement CSharpASTAnalyzer
      throw new Error('C# AST analyzer not yet implemented');
    
    case 'python':
      // TODO: Implement PythonASTAnalyzer using @babel/parser
      throw new Error('Python AST analyzer not yet implemented');
    
    case 'javascript':
    case 'typescript':
      // TODO: Implement JSASTAnalyzer using @babel/parser
      throw new Error('JavaScript/TypeScript AST analyzer not yet implemented');
    
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

/**
 * Analyze code and return deep insights
 */
export async function analyzeCode(code, language = 'php') {
  const analyzer = createASTAnalyzer(language);
  return analyzer.analyze(code);
}
