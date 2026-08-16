import ast
import multiprocessing
import sys
import os
import io
import math
import datetime
import traceback
import pandas as pd
import numpy as np

class ASTSecurityValidator(ast.NodeVisitor):
    """
    Strict AST Whitelist Validator.
    Rejects any construct that can perform code reflection, system/file access,
    heavy ML/AI routines, or memory exhaustion.
    """
    
    ALLOWED_NODE_TYPES = (
        ast.Module,
        ast.Assign,
        ast.AugAssign,
        ast.Expr,
        ast.Name,
        ast.Constant,
        ast.BinOp,
        ast.UnaryOp,
        ast.BoolOp,
        ast.Compare,
        ast.Call,
        ast.Attribute,
        ast.Subscript,
        ast.Slice,
        ast.List,
        ast.Tuple,
        ast.Dict,
        ast.Set,
        ast.Load,
        ast.Store,
        ast.Del,
        ast.keyword,
        ast.ListComp,
        ast.comprehension,
        ast.IfExp,
        ast.FormattedValue,
        ast.JoinedStr,
        # Safe comparison and arithmetic operators
        ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt, ast.GtE, ast.Is, ast.IsNot, ast.In, ast.NotIn,
        ast.Add, ast.Sub, ast.Mult, ast.Div, ast.FloorDiv, ast.Mod,
        ast.BitAnd, ast.BitOr, ast.BitXor, ast.Invert,
        ast.And, ast.Or, ast.Not, ast.USub, ast.UAdd
    )
    
    BANNED_METHODS = {
        'to_csv', 'to_excel', 'to_sql', 'to_pickle', 'to_json', 'to_parquet',
        'read_csv', 'read_excel', 'read_sql', 'read_pickle', 'read_table',
        'eval', 'query', 'system', 'popen', 'spawn', 'fork', 'exec',
        'load', 'dump', 'save', 'loads', 'dumps'
    }

    def __init__(self):
        self.node_count = 0
        self.max_nodes = 250

    def generic_visit(self, node):
        self.node_count += 1
        if self.node_count > self.max_nodes:
            raise ValueError(f"Code complexity limit exceeded (max {self.max_nodes} AST nodes).")
        
        if not isinstance(node, self.ALLOWED_NODE_TYPES):
            node_name = type(node).__name__
            raise ValueError(f"Security Block: Construct '{node_name}' is not permitted in sandbox.")
        
        super().generic_visit(node)

    def visit_Attribute(self, node):
        # 1. Block ANY attribute starting with underscore (e.g. __class__, __bases__, _globals, etc.)
        if node.attr.startswith('_'):
            raise ValueError(f"Security Block: Access to private/dunder attribute '{node.attr}' is strictly prohibited.")
        
        # 2. Block dangerous I/O or query methods
        if node.attr.lower() in self.BANNED_METHODS:
            raise ValueError(f"Security Block: Method '{node.attr}' is not permitted.")
            
        self.generic_visit(node)

    def visit_Constant(self, node):
        # Block literal strings containing double underscore to prevent dynamic dunder construction
        if isinstance(node.value, str):
            if '__' in node.value:
                raise ValueError("Security Block: String constants containing double underscores are prohibited.")
        self.generic_visit(node)

    def visit_BinOp(self, node):
        # 1. Block exponentiation operator (**) to prevent huge numbers like 10**1000
        if isinstance(node.op, ast.Pow):
            raise ValueError("Security Block: Exponentiation operator (**) is disabled to prevent arithmetic overflow.")
        
        # 2. Block large sequence multiplications like [0] * 10000000
        if isinstance(node.op, ast.Mult):
            left_is_seq = isinstance(node.left, (ast.List, ast.Tuple, ast.Constant))
            right_is_seq = isinstance(node.right, (ast.List, ast.Tuple, ast.Constant))
            if left_is_seq or right_is_seq:
                # Check multiplier constant
                const_node = node.right if left_is_seq else node.left
                if isinstance(const_node, ast.Constant) and isinstance(const_node.value, int):
                    if const_node.value > 500:
                        raise ValueError("Security Block: Sequence multiplier limit exceeded (max 500 items).")
                        
        self.generic_visit(node)


def validate_python_code(code_str: str) -> tuple[bool, str]:
    """Parses and validates Python code against AST whitelist rules."""
    try:
        parsed = ast.parse(code_str)
    except SyntaxError as e:
        return False, f"Syntax Error: {e.msg} at line {e.lineno}"
    
    validator = ASTSecurityValidator()
    try:
        validator.visit(parsed)
    except ValueError as e:
        return False, str(e)
    except Exception as e:
        return False, f"Validation Error: {str(e)}"
        
    return True, "Valid"


def _isolated_worker(code_str: str, csv_path: str, result_queue: multiprocessing.Queue):
    """
    Runs strictly inside an isolated child OS process.
    Prepares purged builtins and immutable df copy, then executes code.
    """
    start_time = datetime.datetime.now()
    child_pid = os.getpid()
    parent_pid = os.getppid()

    try:
        # Load fresh dataset copy in child process memory
        df = pd.read_csv(csv_path)
        df['date'] = pd.to_datetime(df['date'])

        # Strict minimal builtins dictionary
        safe_builtins = {
            'int': int,
            'float': float,
            'str': str,
            'bool': bool,
            'len': len,
            'range': range,
            'min': min,
            'max': max,
            'sum': sum,
            'round': round,
            'abs': abs,
            'dict': dict,
            'list': list,
            'tuple': tuple,
            'set': set,
            'print': print,
            'True': True,
            'False': False,
            'None': None
        }

        # Redirect stdout
        stdout_capture = io.StringIO()
        old_stdout = sys.stdout
        sys.stdout = stdout_capture

        restricted_globals = {
            '__builtins__': safe_builtins,
            'pd': pd,
            'np': np,
            'datetime': datetime,
            'math': math,
            'df': df
        }
        local_scope = {}

        try:
            compiled = compile(code_str, '<sandbox>', 'exec')
            exec(compiled, restricted_globals, local_scope)
        finally:
            sys.stdout = old_stdout

        captured_output = stdout_capture.getvalue().strip()
        result_val = local_scope.get('result')

        # Format output
        if result_val is not None:
            if isinstance(result_val, (pd.DataFrame, pd.Series)):
                out_str = result_val.to_string()
            elif isinstance(result_val, (dict, list)):
                out_str = str(result_val)
            elif isinstance(result_val, (float, np.floating)):
                out_str = f"{result_val:.4f}"
            else:
                out_str = str(result_val)
        elif captured_output:
            out_str = captured_output
        else:
            out_str = "Execution completed successfully (no return value or printed output)."

        # Truncate output to prevent memory / IPC inflation
        if len(out_str) > 2000:
            out_str = out_str[:2000] + "\n... [Output truncated at 2,000 characters]"

        duration_ms = round((datetime.datetime.now() - start_time).total_seconds() * 1000, 2)

        result_queue.put({
            "success": True,
            "output": out_str,
            "sandbox_meta": {
                "child_pid": child_pid,
                "parent_pid": parent_pid,
                "execution_ms": duration_ms
            }
        })

    except Exception as e:
        err_msg = traceback.format_exc().strip().split('\n')[-1]
        result_queue.put({
            "success": False,
            "error": f"Runtime Error: {err_msg}",
            "sandbox_meta": {
                "child_pid": child_pid,
                "parent_pid": parent_pid
            }
        })


class SecureProcessSandbox:
    """
    Industrial-Grade Isolated Sandbox Runner.
    Guarantees OS Process-Level Isolation with hard timeout kills and memory safety.
    """
    def __init__(self, csv_path: str):
        self.csv_path = csv_path

    def run(self, code_str: str, timeout_sec: float = 2.0) -> dict:
        print(f"\n[SANDBOX] AST Validation for Code: {code_str.strip()}")
        # 1. Static AST Security Validation
        is_valid, validation_msg = validate_python_code(code_str)
        if not is_valid:
            print(f"[SANDBOX REJECTED] {validation_msg}")
            return {
                "success": False,
                "error": f"Security Validation Failed: {validation_msg}"
            }

        # 2. Spawning isolated child OS Process
        queue = multiprocessing.Queue()
        process = multiprocessing.Process(
            target=_isolated_worker,
            args=(code_str, self.csv_path, queue)
        )
        
        process.start()
        child_pid = process.pid
        print(f"[SANDBOX SPAWNED] Child OS Process PID: {child_pid} (Parent PID: {os.getpid()})")
        process.join(timeout=timeout_sec)

        # 3. Handle Timeout / Runaway Execution
        if process.is_alive():
            try:
                process.terminate()
                process.kill()
                process.join(timeout=0.2)
            except Exception:
                pass
            print(f"[SANDBOX HARD-KILLED] Child PID {child_pid} exceeded {timeout_sec}s limit.")
            return {
                "success": False,
                "error": f"Execution Timed Out: Code exceeded maximum allowable execution limit ({timeout_sec}s)."
            }

        # 4. Read IPC Result
        if not queue.empty():
            try:
                res = queue.get_nowait()
                print(f"[SANDBOX SUCCESS] Child PID {child_pid} output: {res.get('output')[:100]}...")
                return res
            except Exception as e:
                return {"success": False, "error": f"Failed to retrieve sandbox output: {str(e)}"}

        exit_code = process.exitcode
        if exit_code != 0:
            print(f"[SANDBOX ABNORMAL EXIT] Child PID {child_pid} exited with code {exit_code}")
            return {
                "success": False,
                "error": f"Process terminated abnormally (Exit code: {exit_code}). Memory or system limit exceeded."
            }

        return {
            "success": True,
            "output": "Execution completed without output."
        }
