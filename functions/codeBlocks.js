const codeBlocks = [
  { id: 1, name: 'fibonacci', title: 'Calculate Fibonacci Sequence', code: 'function fibonacci(n) {  if (n <= 1) return n;  return fibonacci(n - 1) + fibonacci(n - 2);}' },
  { id: 2, name: 'reverse string', title: 'Reverse String', code: 'function reverseString(str) {\n  return str.split("").reverse().join("");\n}' },
  { id: 3, name: 'factorial', title: 'Factorial', code: 'function factorial(num) {\n  if (num === 0 || num === 1) return 1;\n  return num * factorial(num - 1);\n}' },
  { id: 4, name: 'palindrome', title: 'Check Palindrome', code: 'function isPalindrome(str) {\n  const reversed = str.split("").reverse().join("");\n  return str === reversed;\n}' },
];

module.exports = codeBlocks;