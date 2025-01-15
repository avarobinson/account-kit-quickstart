"use client";
import { alchemy, sepolia } from "@account-kit/infra";
import {
  useAuthModal,
  useLogout,
  useSignerStatus,
  useUser,
  useSigner,
  useConnection,
} from "@account-kit/react";
import {
  createSMAV2AccountClient,
  installValidationActions,
} from "@account-kit/smart-contracts/experimental";
import { parseEther } from "viem";
import { useState } from "react";

export default function Home() {
  const { openAuthModal } = useAuthModal();
  const { logout } = useLogout();
  const user = useUser();
  const signer = useSigner();
  const signerStatus = useSignerStatus();
  const { transport } = useConnection();
  const [isSending, setIsSending] = useState(false);

  async function sendUserOperation() {
    if (!signer) {
      console.error("Signer is not available");
      return;
    }
    try {
      // ===================== 1. create mav2 client =====================
      const accountClient = (
        await createSMAV2AccountClient({
          transport: alchemy(transport),
          chain: sepolia,
          signer: signer!,
          policyId: "GAS_MANAGER_POLICY", // TO DO: replace with your gas manager policy ID (https://dashboard.alchemy.com/gas-manager)
        })
      ).extend(installValidationActions);

      setIsSending(true);

      //  ===================== 2. send UO (this will also deploy the smart account on the first UO) =====================
      const uo = await accountClient.sendUserOperation({
        uo: {
          target: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", // The address to call in the UO
          data: "0x", // The calldata to send in the UO
          value: parseEther("0"), // The value to send in the UO
        },
      });
      console.log(
        "User operation sent! \nUO hash: ",
        uo.hash,
        "\nModular v2 Smart Account Address: ",
        uo.request.sender
      );

      const txnHash = await accountClient.waitForUserOperationTransaction(uo);
      console.log("Txn successfully landed! Txn hash: ", txnHash);
      alert(
        `✅ Transaction Confirmed!\nTxn Hash: ${txnHash}\nSender: ${uo.request.sender}`
      );
    } catch (error) {
      alert("❌ Error sending user operation. Check console for details.");
      console.error("Error sending user operation:", error);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-24 gap-4 justify-center text-center">
      {signerStatus.isInitializing ? (
        <>Loading...</>
      ) : user ? (
        <>
          <p className="mt-2 text-xl text-gray-700">
            Welcome,{" "}
            <span className="font-medium">{user.email ?? "anon"}!</span>
          </p>

          <button
            className={`w-fill bg-gray-400 mt-6 p-3 rounded-lg`}
            onClick={sendUserOperation}
            disabled={isSending}
          >
            {isSending
              ? "Sending..."
              : "🚀 Send User Operation with Modular Account v2"}
          </button>
          <button
            className={`w-fill bg-gray-300 mt-8 p-3 rounded-lg`}
            onClick={logout}
          >
            Log Out
          </button>
        </>
      ) : (
        <button
          className={`w-fill bg-gray-400 mt-8 p-3 rounded-lg`}
          onClick={openAuthModal}
        >
          Login
        </button>
      )}
    </main>
  );
}
