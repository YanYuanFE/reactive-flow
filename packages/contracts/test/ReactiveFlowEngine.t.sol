// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import 'forge-std/Test.sol';
import '../lib/reactive-lib/src/interfaces/IReactive.sol';

/**
 * @dev Standalone harness that replicates the _evaluateCondition logic from
 *      ReactiveFlowEngine. We cannot inherit from ReactiveFlowEngine directly
 *      because its constructor calls into AbstractReactive / SERVICE_ADDR which
 *      does not exist in a local Forge test. Instead we extract and test the
 *      pure condition evaluation logic independently.
 */
contract ConditionHarness {
    uint8 public conditionOp;
    uint256 public threshold;
    uint8 public dataOffset;

    constructor(uint8 _op, uint256 _threshold, uint8 _dataOffset) {
        conditionOp = _op;
        threshold = _threshold;
        dataOffset = _dataOffset;
    }

    function evaluateCondition(bytes calldata data) external view returns (bool) {
        if (conditionOp == 0) return true; // NONE

        uint256 offset = uint256(dataOffset) * 32;
        if (data.length < offset + 32) return false;

        uint256 value;
        bytes calldata slice = data[offset:offset + 32];
        value = abi.decode(slice, (uint256));

        if (conditionOp == 1) return value > threshold;   // GT
        if (conditionOp == 2) return value < threshold;   // LT
        if (conditionOp == 3) return value >= threshold;   // GTE
        if (conditionOp == 4) return value <= threshold;   // LTE
        if (conditionOp == 5) return value == threshold;   // EQ
        if (conditionOp == 6) return value != threshold;   // NEQ
        return false;
    }
}

contract ReactiveFlowEngineTest is Test {
    // Condition operators
    uint8 constant OP_NONE = 0;
    uint8 constant OP_GT   = 1;
    uint8 constant OP_LT   = 2;
    uint8 constant OP_GTE  = 3;
    uint8 constant OP_LTE  = 4;
    uint8 constant OP_EQ   = 5;
    uint8 constant OP_NEQ  = 6;

    // ---------------------------------------------------------------
    // NONE — always true
    // ---------------------------------------------------------------

    function test_ConditionNone_AlwaysTrue() public {
        ConditionHarness h = new ConditionHarness(OP_NONE, 100, 0);
        bytes memory data = abi.encode(uint256(50));
        assertTrue(h.evaluateCondition(data));
    }

    function test_ConditionNone_EmptyData() public {
        ConditionHarness h = new ConditionHarness(OP_NONE, 0, 0);
        assertTrue(h.evaluateCondition(""));
    }

    // ---------------------------------------------------------------
    // GT
    // ---------------------------------------------------------------

    function test_ConditionGT_True() public {
        ConditionHarness h = new ConditionHarness(OP_GT, 100, 0);
        bytes memory data = abi.encode(uint256(200));
        assertTrue(h.evaluateCondition(data));
    }

    function test_ConditionGT_False_Equal() public {
        ConditionHarness h = new ConditionHarness(OP_GT, 100, 0);
        bytes memory data = abi.encode(uint256(100));
        assertFalse(h.evaluateCondition(data));
    }

    function test_ConditionGT_False_Less() public {
        ConditionHarness h = new ConditionHarness(OP_GT, 100, 0);
        bytes memory data = abi.encode(uint256(50));
        assertFalse(h.evaluateCondition(data));
    }

    // ---------------------------------------------------------------
    // LT
    // ---------------------------------------------------------------

    function test_ConditionLT_True() public {
        ConditionHarness h = new ConditionHarness(OP_LT, 100, 0);
        bytes memory data = abi.encode(uint256(50));
        assertTrue(h.evaluateCondition(data));
    }

    function test_ConditionLT_False_Equal() public {
        ConditionHarness h = new ConditionHarness(OP_LT, 100, 0);
        bytes memory data = abi.encode(uint256(100));
        assertFalse(h.evaluateCondition(data));
    }

    function test_ConditionLT_False_Greater() public {
        ConditionHarness h = new ConditionHarness(OP_LT, 100, 0);
        bytes memory data = abi.encode(uint256(200));
        assertFalse(h.evaluateCondition(data));
    }

    // ---------------------------------------------------------------
    // GTE
    // ---------------------------------------------------------------

    function test_ConditionGTE_True_Greater() public {
        ConditionHarness h = new ConditionHarness(OP_GTE, 100, 0);
        bytes memory data = abi.encode(uint256(200));
        assertTrue(h.evaluateCondition(data));
    }

    function test_ConditionGTE_True_Equal() public {
        ConditionHarness h = new ConditionHarness(OP_GTE, 100, 0);
        bytes memory data = abi.encode(uint256(100));
        assertTrue(h.evaluateCondition(data));
    }

    function test_ConditionGTE_False() public {
        ConditionHarness h = new ConditionHarness(OP_GTE, 100, 0);
        bytes memory data = abi.encode(uint256(50));
        assertFalse(h.evaluateCondition(data));
    }

    // ---------------------------------------------------------------
    // LTE
    // ---------------------------------------------------------------

    function test_ConditionLTE_True_Less() public {
        ConditionHarness h = new ConditionHarness(OP_LTE, 100, 0);
        bytes memory data = abi.encode(uint256(50));
        assertTrue(h.evaluateCondition(data));
    }

    function test_ConditionLTE_True_Equal() public {
        ConditionHarness h = new ConditionHarness(OP_LTE, 100, 0);
        bytes memory data = abi.encode(uint256(100));
        assertTrue(h.evaluateCondition(data));
    }

    function test_ConditionLTE_False() public {
        ConditionHarness h = new ConditionHarness(OP_LTE, 100, 0);
        bytes memory data = abi.encode(uint256(200));
        assertFalse(h.evaluateCondition(data));
    }

    // ---------------------------------------------------------------
    // EQ
    // ---------------------------------------------------------------

    function test_ConditionEQ_True() public {
        ConditionHarness h = new ConditionHarness(OP_EQ, 42, 0);
        bytes memory data = abi.encode(uint256(42));
        assertTrue(h.evaluateCondition(data));
    }

    function test_ConditionEQ_False() public {
        ConditionHarness h = new ConditionHarness(OP_EQ, 42, 0);
        bytes memory data = abi.encode(uint256(43));
        assertFalse(h.evaluateCondition(data));
    }

    // ---------------------------------------------------------------
    // NEQ
    // ---------------------------------------------------------------

    function test_ConditionNEQ_True() public {
        ConditionHarness h = new ConditionHarness(OP_NEQ, 42, 0);
        bytes memory data = abi.encode(uint256(100));
        assertTrue(h.evaluateCondition(data));
    }

    function test_ConditionNEQ_False() public {
        ConditionHarness h = new ConditionHarness(OP_NEQ, 42, 0);
        bytes memory data = abi.encode(uint256(42));
        assertFalse(h.evaluateCondition(data));
    }

    // ---------------------------------------------------------------
    // Data offset handling
    // ---------------------------------------------------------------

    function test_DataOffset_ReadsCorrectSlot() public {
        // dataOffset=1 means read the second 32-byte word
        ConditionHarness h = new ConditionHarness(OP_EQ, 999, 1);
        bytes memory data = abi.encode(uint256(111), uint256(999));
        assertTrue(h.evaluateCondition(data));
    }

    function test_DataOffset_TooShort_ReturnsFalse() public {
        // dataOffset=1 but only 32 bytes of data available
        ConditionHarness h = new ConditionHarness(OP_GT, 0, 1);
        bytes memory data = abi.encode(uint256(100));
        assertFalse(h.evaluateCondition(data));
    }

    function test_DataOffset_Zero_EmptyData_ReturnsFalse() public {
        ConditionHarness h = new ConditionHarness(OP_GT, 0, 0);
        assertFalse(h.evaluateCondition(""));
    }

    // ---------------------------------------------------------------
    // Constructor state (via harness)
    // ---------------------------------------------------------------

    function test_HarnessConstructor_SetsState() public {
        ConditionHarness h = new ConditionHarness(OP_GTE, 1000, 2);
        assertEq(h.conditionOp(), OP_GTE);
        assertEq(h.threshold(), 1000);
        assertEq(h.dataOffset(), 2);
    }

    // ---------------------------------------------------------------
    // Invalid operator returns false
    // ---------------------------------------------------------------

    function test_InvalidOperator_ReturnsFalse() public {
        ConditionHarness h = new ConditionHarness(7, 100, 0);
        bytes memory data = abi.encode(uint256(100));
        assertFalse(h.evaluateCondition(data));
    }

    // ---------------------------------------------------------------
    // Edge: value = 0, threshold = 0
    // ---------------------------------------------------------------

    function test_EdgeZeroValues_GT() public {
        ConditionHarness h = new ConditionHarness(OP_GT, 0, 0);
        bytes memory data = abi.encode(uint256(0));
        assertFalse(h.evaluateCondition(data));
    }

    function test_EdgeZeroValues_GTE() public {
        ConditionHarness h = new ConditionHarness(OP_GTE, 0, 0);
        bytes memory data = abi.encode(uint256(0));
        assertTrue(h.evaluateCondition(data));
    }

    function test_EdgeZeroValues_EQ() public {
        ConditionHarness h = new ConditionHarness(OP_EQ, 0, 0);
        bytes memory data = abi.encode(uint256(0));
        assertTrue(h.evaluateCondition(data));
    }
}
